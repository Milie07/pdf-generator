const { convertMontantTotalEnLettres } = require("../utils/convertNumber");
const fs = require("fs");
const puppeteer = require("puppeteer");

const CHEMIN_JSON = "./data/locataires.json";
const CHEMIN_SAUVEGARDE = "./data/locataires.backup.json";

// ---------------------------------------------------------------------------
// Fonctions utilitaires
// ---------------------------------------------------------------------------

// Arrondi au centime (ex: 612.3456 -> 612.35)
function arrondi2(x) {
	return Math.round(x * 100) / 100;
}

// 1er jour d'un mois donné (gère automatiquement le passage d'année : mois 12 -> janvier de l'année suivante)
function premierDuMois(annee, mois) {
	return new Date(annee, mois, 1);
}

// Date -> "AAAA-MM-JJ" en heure locale (toISOString() passerait en UTC et pourrait décaler d'un jour)
function formatISO(date) {
	const m = String(date.getMonth() + 1).padStart(2, "0");
	const j = String(date.getDate()).padStart(2, "0");
	return `${date.getFullYear()}-${m}-${j}`;
}

// "AAAA-MM-JJ" -> Date en heure locale (new Date("AAAA-MM-JJ") serait interprété en UTC)
function lireDateISO(texte) {
	const [a, m, j] = texte.split("-").map(Number);
	return new Date(a, m - 1, j || 1);
}

// Calcule charges et total TTC pour un loyer donné
// - professionnel : TVA 20% du loyer
// - particulier   : provision pour charges fixe du JSON
function calculerMontants(loyer, locataire) {
	const charges =
		locataire.categorie === "professionnel" ? arrondi2(loyer * 0.2) : locataire.charge;
	return { charges, ttc: arrondi2(loyer + charges) };
}

// ---------------------------------------------------------------------------
// Programme principal
// ---------------------------------------------------------------------------

async function genererQuittances() {
	let data;
	try {
		//Lecture du fichier json
		data = fs.readFileSync(CHEMIN_JSON, "utf-8");
	} catch (err) {
		console.error("Erreur de lecture du fichier json :", err);
		return;
	}

	// Lancement de puppeteer
	const browser = await puppeteer.launch();

	try {
		//Analyse des données JSON
		const config = JSON.parse(data);
		let jsonModifie = false; // passe à true si un loyer est notifié ou appliqué

        // Gestion des différentes dates
		// Date simulable pour les tests : node src/generatePdf.js 2026-09-15
		const dateEnCours = process.argv[2] ? lireDateISO(process.argv[2]) : new Date();
		const annee = dateEnCours.getFullYear(); // Année de la quittance
		const mois = dateEnCours.getMonth(); // Mois de la quittance
		const debutMoisQuittance = premierDuMois(annee, mois); // 1er jour du mois de la quittance
		const debutMoisAvis = premierDuMois(annee, mois + 1); // 1er jour du mois de l'avis
		const premierJour = 1;
		const dernierJour = new Date(annee, mois + 1, 0).getDate(); // dernier jour du mois courant
		const dernierJourAvis = new Date(annee, mois + 2, 0).getDate(); // dernier jour du mois suivant
		const dateBrut = dateEnCours.toLocaleDateString("fr-FR", {
			month: "long",
			year: "numeric",
		}); // Mois et Année de la quittance au format string
		const dateBrutAvis = debutMoisAvis.toLocaleDateString("fr-FR", {
				month: "long",
				year: "numeric",
			},
		); // Mois et Année du mois suivant
		const dDate = dateEnCours.toLocaleDateString("fr-FR", {
			day: "numeric",
			month: "long",
			year: "numeric",
		}); // Date entière de réalisation de la quittance

		for (const bailleur of config.bailleur) {
			const sci = bailleur.sci;
			for (const locataire of bailleur.locataires) {
				let nomLocataire = locataire.nom + " " + locataire.prenom;
				const adresseLocataire =
					locataire.adresse.numero + " " + locataire.adresse.rue;
				const villeLocataire =
					locataire.adresse.code + " " + locataire.adresse.ville;
				const appartLocataire = locataire.type + " " + locataire.etage;
				let libelleBail = "contrat de location";
				let libelleLogement = "logement";
				let labelChargeQuittance = "Provisions pour charge : ";
				let labelChargeAvis = "Montant des charges mensuelles : ";

                // Condition en cas de location par un professionnel
				if (locataire.categorie === "professionnel") {
					nomLocataire = locataire.societe;
					libelleBail = "bail commercial";
					libelleLogement = "local commercial";
					labelChargeAvis = "TVA 20% : ";
					labelChargeQuittance = "TVA 20% : ";
				}

				const regul = locataire.regul;

				// --- ÉTAPE A : application d'une révision déjà notifiée ---
				// Si une révision a été notifiée et que le mois de la quittance a atteint
				// la date d'effet, le nouveau loyer devient le loyer du JSON.
				if (regul.prochainLoyer &&
					debutMoisQuittance >= lireDateISO(regul.prochainLoyer.dateEffet)) {
					console.log(nomLocataire, " -> loyer mis à jour :", locataire.loyer.toFixed(2), "->", regul.prochainLoyer.montant.toFixed(2), "🔄");
					locataire.loyer = regul.prochainLoyer.montant; // nouveau loyer de référence
					regul.ancien = regul.nouvel; // l'indice actuel devient l'ancien pour l'an prochain
					delete regul.prochainLoyer; // révision traitée : on l'efface
					jsonModifie = true;
				}

				// --- Montants de la quittance (mois en cours) ---
				const loyer = locataire.loyer;
				const { charges, ttc: loyerTtc } = calculerMontants(loyer, locataire);

				// --- Montants de l'avis (mois suivant) ---
				// Si le nouveau loyer prend effet le mois de l'avis, l'avis l'affiche déjà.
				const loyerAvis =
					regul.prochainLoyer &&
					debutMoisAvis >= lireDateISO(regul.prochainLoyer.dateEffet)
						? regul.prochainLoyer.montant
						: loyer;
				const { charges: chargesAvis, ttc: loyerTtcAvis } = calculerMontants(loyerAvis, locataire);

				const bail = new Date(locataire.bail).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                }); // Date entière du bail

                const bailAnniversaire = new Date(locataire.bail).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                }); // Date Anniversaire du Bail pour la régul

                // 1er jour du mois suivant l'anniversaire du bail = date d'effet de la régul.
                // On prend la prochaine date d'effet à venir : si celle de cette année est déjà
                // passée (ex: bail en janvier, on est en décembre), on prend celle de l'année suivante.
                const bailRegul = new Date(locataire.bail);
                let MoisSuivantRegul = premierDuMois(annee, bailRegul.getMonth() + 1);
                if (MoisSuivantRegul < debutMoisQuittance) {
                    MoisSuivantRegul = premierDuMois(annee + 1, bailRegul.getMonth() + 1);
                }
                const dateRegul = MoisSuivantRegul.toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                });

                // Calcul de la révision : arrondi au centime
                const nouvelIRL = regul.nouvel;
                const ancienIRL = regul.ancien;
                const nouveauLoyer = ancienIRL > 0 ? arrondi2((loyer * nouvelIRL) / ancienIRL) : loyer;
                const { charges: chargesRegul, ttc: nouveauLoyerTtc } = calculerMontants(nouveauLoyer, locataire);

                // --- ÉTAPE B : notification ---
                // La div de régul s'affiche 2 mois avant MoisSuivantRegul (= 1 mois avant l'anniversaire du bail)
                const ecartMoisRegul =
                    (MoisSuivantRegul.getFullYear() - annee) * 12 +
                    (MoisSuivantRegul.getMonth() - mois);
                const indicesValides = ancienIRL > 0 && nouvelIRL > 0 && nouvelIRL !== ancienIRL;
                // Pas de révision avant le 1er anniversaire du bail
                const premiereRevisionPossible = premierDuMois(bailRegul.getFullYear() + 1, bailRegul.getMonth() + 1);
                const afficherRegul =
                    ecartMoisRegul === 2 &&
                    indicesValides &&
                    MoisSuivantRegul >= premiereRevisionPossible;

                // Déjà notifiée à l'identique (script relancé le même mois) -> on ne réécrit rien
                const dejaNotifie =
                    regul.prochainLoyer &&
                    regul.prochainLoyer.dateEffet === formatISO(MoisSuivantRegul) &&
                    regul.prochainLoyer.montant === nouveauLoyer;

                                console.log("DIAG", nomLocataire, {
                    bail: locataire.bail,
                    dateEffet: formatISO(MoisSuivantRegul),
                    ecartMoisRegul,
                    ancienIRL,
                    nouvelIRL,
                    indicesValides,
                    premiereRevisionPossible: formatISO(premiereRevisionPossible),
                    afficherRegul,
                    dejaNotifie,
                });
                
                if (afficherRegul && !dejaNotifie) {
                    // On mémorise la révision notifiée : elle sera appliquée par l'étape A à la date d'effet
                    regul.prochainLoyer = {
                        montant: nouveauLoyer,
                        dateEffet: formatISO(MoisSuivantRegul),
                        notifieLe: formatISO(dateEnCours),
                    };
                    jsonModifie = true;
                    console.log(nomLocataire, " -> révision notifiée :", nouveauLoyer.toFixed(2), "au", dateRegul, "📩");
                }

                // Montant en lettres calculé APRÈS le calcul de la TVA (montant final de la quittance)
                const convertEuros = convertMontantTotalEnLettres(loyerTtc);
                console.log(sci, " -> ", nomLocataire, " - loyer TTC -> ", loyerTtc.toFixed(2), "✅");

				// Affichage dans le HTML
				let htmlTemplate = fs.readFileSync(
					"./templates/quittance.html",
					"utf-8",
				);

                // Remplacement des valeurs dans les accolades
				htmlTemplate = htmlTemplate
					.replaceAll("{{ societe }}", sci)
					.replaceAll("{{ convertAvecCts }}", convertEuros.toUpperCase())
					.replaceAll(
						"{{ dateBrut }}",
						dateBrut.charAt(0).toUpperCase() + dateBrut.slice(1),
					)
					.replaceAll(
						"{{ dateBrutAvis }}",
						dateBrutAvis.charAt(0).toUpperCase() + dateBrutAvis.slice(1),
					)
					.replaceAll("{{ date }}", dDate)
					.replaceAll("{{ premier }}", premierJour)
					.replaceAll("{{ dernier }}", dernierJour)
					.replaceAll("{{ dernier-avis }}", dernierJourAvis)
					.replaceAll("{{ nom-locataire }}", nomLocataire)
					.replaceAll("{{ adresse-locataire }}", adresseLocataire)
					.replaceAll("{{ ville-locataire }}", villeLocataire)
					.replaceAll("{{ appart-locataire }}", appartLocataire)
					.replaceAll("{{ libelle-bail }}", libelleBail)
					.replaceAll("{{ libelle-logement }}", libelleLogement)
					.replaceAll("{{ date-bail }}", bail)
					.replaceAll("{{ loyer }}", loyer.toFixed(2))
					.replaceAll("{{ label-charge-quittance }}", labelChargeQuittance)
					.replaceAll("{{ label-charge-avis }}", labelChargeAvis)
					.replaceAll("{{ charges }}", charges.toFixed(2))
					.replaceAll("{{ loyerTtc }}", loyerTtc.toFixed(2))
					.replaceAll("{{ loyer-avis }}", loyerAvis.toFixed(2))
					.replaceAll("{{ charges-avis }}", chargesAvis.toFixed(2))
					.replaceAll("{{ loyerTtc-avis }}", loyerTtcAvis.toFixed(2))
                    .replace("{{ bail-anniv }}", bailAnniversaire)
                    .replace("{{ date-regul }}", dateRegul)
                    .replace("{{ ancien-irl }}", ancienIRL.toFixed(2))
                    .replace("{{ nouvel-irl }}", nouvelIRL.toFixed(2))
                    .replace("{{ nouveau-loyer }}", nouveauLoyer.toFixed(2))
                    .replace("{{ charges-regul }}", chargesRegul.toFixed(2))
                    .replace("{{ nouveau-loyer-ttc }}", nouveauLoyerTtc.toFixed(2));


				// Génération des Pdfs
				const page = await browser.newPage();
				await page.setContent(htmlTemplate, { waitUntil: "networkidle0" });
				if (!afficherRegul) {
					await page.evaluate(() => {
						document.getElementById("regul")?.remove();
					});
				}
				await page.addStyleTag({ path: `templates/style.css` });
				await page.pdf({
					path: `./output/${nomLocataire} - ${dateBrut}.pdf`,
					format: "A4",
					printBackground: true,
				});
				await page.close();
			}
		}

		// Enregistrement du JSON uniquement si tous les PDFs ont été générés et qu'il y a eu un changement
		if (jsonModifie) {
			fs.copyFileSync(CHEMIN_JSON, CHEMIN_SAUVEGARDE); // sauvegarde de la version précédente
			fs.writeFileSync(CHEMIN_JSON, JSON.stringify(config, null, "\t") + "\n", "utf-8");
			console.log("💾 Fichier locataires.json mis à jour (sauvegarde : locataires.backup.json)");
		}
	} finally {
		await browser.close();
	}
}

genererQuittances();
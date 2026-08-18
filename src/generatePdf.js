const { convertMontantTotalEnLettres } = require("../utils/convertNumber");
const fs = require("fs");
const puppeteer = require("puppeteer");

async function genererQuittances() {
	let data;
	try {
		//Lecture du fichier json
		data = fs.readFileSync("./data/locataires.json", "utf-8");
	} catch (err) {
		console.error("Erreur de lecture du fichier json :", err);
		return;
	}

	// Lancement de puppeteer
	const browser = await puppeteer.launch();

	try {
		//Analyse des données JSON
		const config = JSON.parse(data);

        // Gestion des différentes dates
		const dateEnCours = new Date();
		const annee = dateEnCours.getFullYear(); // Année de la quittance
		const mois = dateEnCours.getMonth(); // Mois de la quittance
		const premierJour = 1;
		const dernierJour = new Date(annee, mois + 1, 0).getDate(); // dernier jour du mois courant
		const dernierJourAvis = new Date(annee, mois + 2, 0).getDate(); // dernier jour du mois suivant
		const dateBrut = dateEnCours.toLocaleDateString("fr-FR", {
			month: "long",
			year: "numeric",
		}); // Mois et Année de la quittance au format string 
		const dateBrutAvis = new Date(annee, mois + 1, 1).toLocaleDateString("fr-FR", {
				month: "long",
				year: "numeric",
			},
		); // Mois et Année du mois suivant
		const dDate = new Date().toLocaleDateString("fr-FR", {
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

				const bail = new Date(locataire.bail).toLocaleDateString("fr-FR", {
                    day: "numeric", 
                    month: "long", 
                    year: "numeric"
                }); // Date entière du bail 

                const bailAnniversaire = new Date(locataire.bail).toLocaleDateString("fr-FR", {
                    day: "numeric", 
                    month: "long", 
                }); // Date Anniversaire du Bail pour la régul

                const bailRegul = new Date(locataire.bail);
                const MoisSuivantRegul = new Date(annee, bailRegul.getMonth() + 1, 1);
                const dateRegul = MoisSuivantRegul.toLocaleDateString("fr-FR", {
                    day: "numeric", 
                    month: "long", 
                    year: "numeric"
                });
                // 1er jour du mois suivant pour la prise en compte de la regul par rapport a bailAnniversaire

				const loyer = locataire.loyer;
				let charges = locataire.charge;
				let loyerTtc = locataire.loyer + locataire.charge;
				let labelChargeQuittance = "Provisions pour charge : ";
				let labelChargeAvis = "Montant des charges mensuelles : ";
                const nouvelIRL = locataire.regul.nouvel;
                const ancienIRL = locataire.regul.ancien;
                const nouveauLoyer = (loyer * nouvelIRL) / ancienIRL;
                const nouveauLoyerTtc = nouveauLoyer + charges;
                console.log(sci, " -> ", locataire.nom, " - loyer TTC -> ", loyerTtc.toFixed(2), "✅");

                
                const convertEuros = convertMontantTotalEnLettres(loyerTtc);

                // Condition en cas de location par un professionnel
				if (locataire.categorie === "professionnel") {
					nomLocataire = locataire.societe;
					charges = loyer * 0.2;
					libelleBail = "bail commercial";
					libelleLogement = "local commercial";
					loyerTtc = loyer + charges;
					labelChargeAvis = "TVA 20% : ";
					labelChargeQuittance = "TVA 20% : ";
				}

                // La div de régul s'affiche 2 mois avant MoisSuivantRegul (= 1 mois avant l'anniversaire du bail)
                const ecartMoisRegul =
                    (MoisSuivantRegul.getFullYear() - annee) * 12 +
                    (MoisSuivantRegul.getMonth() - mois);
                const afficherRegul = ecartMoisRegul === 2;

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
                    .replace("{{ bail-anniv }}", bailAnniversaire)
                    .replace("{{ date-regul }}", dateRegul)
                    .replace("{{ ancien-irl }}", ancienIRL.toFixed(2))
                    .replace("{{ nouvel-irl }}", nouvelIRL.toFixed(2))
                    .replace("{{ nouveau-loyer }}", nouveauLoyer.toFixed(2))
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
	} finally {
		await browser.close();
	}
}

genererQuittances();

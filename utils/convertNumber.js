/**
 * Fonction qui convertit un nombre en chiffre en un nombre en toutes lettres
 * 
 */

/*
---------------------Règles de Grammaire en français-------------------------
- Mille (1000) -> toujours invariable.
- Vingt (20) et Cent (100) -> Prennent toujours un "s" s'ils sont multipliés et qu'ils terminent le nombre (ex: trois-cents / quatre-vingts).
- Vingt (20) et Cent (100) -> Perdent le "s" s'ils sont suivis par un nombre (ex: vingt-et-un / trois-cent-cinq).
- Le trait d'union est mis entre tous les mots d'un même nombre (ex: trente-trois)
- La conjonction "et" est utilisée pour relier une dizaine à un "un" ou un "onze".
    - Pas de "et" pour le chiffre quatre-vingt-un (81).
    - Pas de "et" si le nombre se termine par autre chose que "un" ou "onze".
    - Pas de "et" après "cent" et "mille"
*/

const irreguliers = {
    11: "onze",
    12: "douze",
    13: "treize",
    14: "quatorze",
    15: "quinze",
    16: "seize"
}

const unites = {
    0: "zéro",
    1: "un",
    2: "deux",
    3: "trois",
    4: "quatre",
    5: "cinq",
    6: "six",
    7: "sept",
    8: "huit",
    9: "neuf"
}

const dizaines = {
    10: "dix",
    20: "vingt",
    30: "trente",
    40: "quarante",
    50: "cinquante",
    60: "soixante"
}

const centaines= {
    100: "cent",
    200: "deux-cent",
    300: "trois-cent",
    400: "quatre-cent",
    500: "cinq-cent",
    600: "six-cent",
    700: "sept-cent",
    800: "huit-cent",
    900: "neuf-cent"
}

let n;
let resultat;

function convertirUnite(u) {
    return unites[u];
}

function convertirDeuxChiffres(reste) {
    let d = Math.floor(reste / 10);
    let u = Math.floor(reste % 10);
    let mot;
    
    if (reste >= 11 && reste <= 16) {
        mot = irreguliers[reste];
    } else if (reste >= 17 && reste <= 19) {
        mot = dizaines[10] + "-" + unites[u];
    } else if (u === 0 && d <= 6) {
        mot = dizaines[d * 10];
    } else if ( d >= 1 && d <= 6) {
        if (u === 1) {
            mot = dizaines[d * 10] + "-et-" + unites[1];
        } else {
            mot = dizaines[d * 10] + "-" + unites[u];
        }
    } else if (d === 7) {
        mot = dizaines[60] + "-" + convertirDeuxChiffres(10 + u);
    } else if (d === 8 && u === 0) {
        mot = "quatre-vingts";
    } else if (d === 8) {
        mot = "quatre-vingt-" + unites[u];
    } else if (d === 9) {
        mot = "quatre-vingt-" + convertirDeuxChiffres(10 + u);
    }
    return mot
}

function convertirTroisChiffres(reste) {
    let c = Math.floor(reste / 100);
    let resteDeux = Math.floor(reste % 100);
    let mot;
    
    if (c >= 1 && c <= 9) {
        if (resteDeux === 0) {
            if ( c === 1) {
                mot = centaines[c * 100];
            } else {
                mot = centaines[c * 100] + "s";
            }
        } else {
            mot = centaines[c * 100] + "-" + convertEurosEnLettres(resteDeux)
        }
    }
    return mot;
}

function convertEurosEnLettres(n) {
    if (n <= 9) {
        resultat = convertirUnite(n);
    } else if (n <= 99) {
        resultat = convertirDeuxChiffres(n);
    } else {
        resultat = convertirTroisChiffres(n)
    }
    return resultat
}

function convertMontantTotalEnLettres(montant) {
    const centimesTotal = Math.round(montant * 100);
    const euros = Math.floor(centimesTotal / 100);
    const centimes = centimesTotal % 100;

    let resultat = convertEurosEnLettres(euros) + (euros > 1 ? " euros" : " euro");

    if (centimes > 0) {
        resultat += " et " + convertEurosEnLettres(centimes) + (centimes > 1 ? " centimes" : " centime");
    }

    return resultat;
}

module.exports = { convertMontantTotalEnLettres };
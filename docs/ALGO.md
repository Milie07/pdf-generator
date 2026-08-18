# Algorythmes
---------------------

## Algorythme de conversion
But -> Algorythme pour convertir un chiffre entre 0 et 999 en toutes lettres (ex: 202 -> Deux cent deux)

---------------------

ALGORYTHME ConvertirNombreEnLettres

CONSTANTES
    // Tableau associatif : clé = nombre, valeur = mot
    UNITES       : TABLEAU[0..9] DE CHAINE
    IRREGULIERS  : TABLEAU[11..16] DE CHAINE   // onze à seize
    DIZAINES     : TABLEAU[10,20,30,40,50,60] DE CHAINE
    CENTAINES    : TABLEAU[1..9] DE CHAINE     // mot de base "cent" x1 à x9, sans "s"

VARIABLES
    n              : ENTIER          // le nombre à convertir, entre 0 et 999
    resultat       : CHAINE          // le mot final construit progressivement

CONSTANTES
    UNITES <- {
        0 -> "zéro",   1 -> "un",    2 -> "deux",  3 -> "trois", 4 -> "quatre",
        5 -> "cinq",   6 -> "six",   7 -> "sept",  8 -> "huit",  9 -> "neuf"
    }

    IRREGULIERS <- {
        11 -> "onze",     12 -> "douze",   13 -> "treize",
        14 -> "quatorze", 15 -> "quinze",  16 -> "seize"
    }

    DIZAINES <- {
        10 -> "dix",     20 -> "vingt",     30 -> "trente",
        40 -> "quarante", 50 -> "cinquante", 60 -> "soixante"
    }

    CENTAINES <- {
        100 -> "cent",   200 -> "deux-cent",   300 -> "trois-cent",
        400 -> "quatre-cent", 500 -> "cinq-cent", 600 -> "six-cent",
        700 -> "sept-cent", 800 -> "huit-cent", 900 -> "neuf-cent"
    }

FONCTION ConvertirUnites(u : ENTIER) : CHAINE
DEBUT
    RETOURNER UNITES[u]
FIN

FONCTION ConvertirDeuxChiffres(reste : ENTIER)
VARIABLES
    d : ENTIER
    u : ENTIER
    mot : CHAINE
DEBUT
    d <- reste DIV 10
    u <- reste MOD 10

    SI reste >= 11 ET reste <= 16 ALORS
        mot <- IRREGULIERS[reste]
    SINON SI reste >= 17 ET reste <= 19 ALORS
        mot <- DIZAINES[10] + "-" + UNITES[u]
    SINON SI u = 0 ET d <= 6 ALORS
        mot <- DIZAINES[d * 10]
        
    SINON SI d >= 1 ET d <= 6 ALORS
        SI u = 1 ALORS
            mot <- DIZAINES[d * 10] + "-et-" + UNITES[1]
        SINON
            mot <- DIZAINES[d * 10] + "-" + UNITES[u] 
        FIN SI
    SINON SI d = 7 ALORS
        mot <- DIZAINES[60] + "-" + ConvertirDeuxChiffres(10 + u)
    SINON SI d = 8 ET u = 0 ALORS
        mot <- "quatre-vingts"
    SINON SI d = 8 ALORS
        mot <- "quatre-vingt-" + UNITES[u]
    SINON SI d = 9 ALORS
        mot <- "quatre-vingt-" + ConvertirDeuxChiffres(10 + u)
    FIN SI
    RETOURNER mot
FIN
 
FONCTION ConvertirTroisChiffres(reste : ENTIER)
VARIABLES
    c : ENTIER
    resteDeux : ENTIER
    mot : CHAINE
DEBUT 
    c <- reste DIV 100
    resteDeux <- reste MOD 100

    SI c >= 1 ET c <= 9 ALORS
        SI resteDeux = 0 ALORS
            SI c = 1 ALORS
                mot <- CENTAINES[c * 100]
            SINON
                mot <- CENTAINES[c * 100] + "s"
            FIN SI
        SINON
            mot <- CENTAINES[c * 100] + "-" + ConvertirDeuxChiffres(resteDeux)
        FIN SI
    FIN SI
    RETOURNER mot
FIN

DEBUT

    LIRE n

    SI n <= 9 ALORS
        resultat <- ConvertirUnites(n)
    SINON SI n <= 99 ALORS
        resultat <- ConvertirDeuxChiffres(n)
    SINON 
        resultat <- ConvertirTroisChiffres(n)
    FIN SI

    ECRIRE resultat
FIN 

FONCTION ConvertirNombreEnLettres(montant : REEL)
VARIABLES
    montant : REEL
    euros : ENTIER
    centimes : ENTIER
    centimesTotal : ENTIER
    resultat : CHAINE

DEBUT
    montant <- ConvertirNombreEnLettres(centimesTotal)
    euros <- centimesTotal DIV 100
    centimes <- centimesTotal MOD 100
    centimesTotal <- montant * 100
    
    SI euros > 1 ALORS
        resultat <- ConvertirNombreEnLettres(euros) + "euros"
    SINON 
        resultat <- ConvertirNombreEnLettres(euros) + "euro"
    FIN SI

    SI centimes > 0 ALORS
        resultat <- resultat + " et " + ConvertirNombreEnLettres(centimes)
        SI centimes > 1 ALORS
            resultat <- resultat + " et " + ConvertirNombreENLettres(centimes) + " centimes "
        SINON SI centimes = 1 ALORS
            resultat <- resultat + " et " + ConvertirNombreENLettres(centimes) + " centime "
        FIN SI
    FIN SI
    Retourner resultat
FIN

---------------------
 si regul 
    loyer = nouveauLoyer
    
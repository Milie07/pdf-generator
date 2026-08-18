# Pdf-generator
Outil de génération de PDF pour des quittances de loyer avec template HTML / CSS - Installation en local. 
L'utilisateur va pouvoir générer ses quittances mensuelles, nominatives et avec les bons montants directement à partir d'un .bat.

--- 
## Versions
- V1.0.0 - Version Initiale

## Stack-technique
- Node v24.18.0
- Dependencies :
  - Nodemon v3.1.14
  - Puppeteer v25.8.0

## Fonctionnalités
- Génération de Pdf à partir d'un .bat
- Template HTML 
- Fonction de conversion de nombres en chiffres, en nombres en lettres
- Architecture 

## Pré-requis
- node v24.18.0
- git v2.51.0.windows.1
  
## Installation en local
1. Ouvrir un terminal
2. Cloner le dépôt :
```bash
git clone <url-du-repo>
```
3. Alimenter le fichier locataire.test.json avec les vraies valeurs
4. Créer un dossier output/ à la racine du projet
5. Lancer le script :
en cliquant sur <chemin-du-repo>/pdf-generator/generer-quittance.bat 
*(possibilité de créer un raccourci sur le bureau pour faciliter l'accès suivant où le repo est cloné...)*

## Format Json
```json
{   "bailleur": [
                {
                "_comment": "sci (société civile immobilière) en cas de gestion par des société",
	                "sci": "",
		            "locataires": [
			            {
                            "_comment": "si locataire particulier",
			                "categorie": "particulier",
			                "nom": "",
			                "prenom": "",
			                "type": "",
			                "etage": "",
			                "loyer": 0,
			                "charge": 0,
			                "adresse": {
			    	            "numero": "",
			    	            "rue": "",
			    	            "code": "",
			    	            "ville": ""
			                },
                            "bail": "",
                            "regul": {
                                "_comment": "ancier et nouvel indice IRL (indice de référence des loyers) à rentrer manuellement - publié sur (https://www.anil.org/outils/indices-et-plafonds/tableau-de-lirl/) avec 2 trimestres de décalage",
                                "ancien": 0,
                                "nouvel": 0 
                            }
                        },
                        {
                            "_comment": "si locataire professionnel",
			                "categorie": "professionnel",
			                "societe": "",
			                "type": "",
			                "etage": "",
			                "loyer": 0,
			                "charge": 0,
			                "adresse": {
			    	            "numero": "",
			    	            "rue": "",
			    	            "code": "",
			    	            "ville": ""
			                },
                            "bail": "",
                            "regul": {
                                "_comment": "ancier et nouvel indice ILC (indice des loyers commerciaux) à rentrer manuellement - publié sur (https://www.insee.fr/fr/statistiques/serie/001532540) avec 2 trimestres de décalage",
                                "ancien": 0,
                                "nouvel": 0 
                            }
                        }
                    ]
		        }
    ]
}
```
*retirer les _comment avant de copier le modèle Json*

## Structure du projet
```
pdf-generator
|-data/
|  |-locataires.json 
|  |-locataires.test.json
|-docs/ 
|-node_modules/ 
|-output/
|-src/
|  |-generatePdf.js
|-templates
|  |-quittance.html
|  |-style.css
|-utils/
|  |-convertNumber.js
|-.gitignore
|-generer-quittance.bat
|-License.md
|-package-lock.json
|-package.json
|-README.md
```

## Améliorations à prévoir

- ◻ Passer en POO plutot qu'en procédural
- ◻ Gérer le nouveau loyer dans le JSON après une regul

## License
License MIT[License.md]




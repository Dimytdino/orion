# Notes techniques Orion

## PostgreSQL / pgAdmin
- Host : IP WSL2 (changer à chaque redémarrage)
- Récupérer l'IP : `hostname -I` depuis WSL
- Port : 5432
- Username : postgres
- Password : voir .env (POSTGRES_PASSWORD)
- Database : geonode / geonode_data

## GeoNode
- URL : http://localhost
- Admin : admin / voir .env (ADMIN_PASSWORD)

## GeoServer
- URL : http://localhost/geoserver/web/
- Admin : admin / voir .env (GEOSERVER_ADMIN_PASSWORD)
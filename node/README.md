# B2E

b2e-wa-backend

docker run --name postgres-container -e POSTGRES_DATABASE=mydb -e POSTGRES_ROOT_PASSWORD=123456 -e POSTGRES_USER=user -e POSTGRES_PASSWORD=123456 -d -p 5432:5432 postgres:latest


# FIRST RUN: INSTALL MYSQL
sudo docker run --name b2e-rh-test-mysql-container -e MYSQL_DATABASE=b2erhdb -e MYSQL_ROOT_PASSWORD=123456 -e MYSQL_USER=user -e MYSQL_PASSWORD=123456 -d -p 3310:3306 mysql/mysql-server:latest

sudo docker run --name test-mysql-container -e MYSQL_DATABASE=b2erhdb -e MYSQL_ROOT_PASSWORD=123456 -e MYSQL_USER=user -e MYSQL_PASSWORD=123456 -d -p 3310:3306 mysql/mysql-server:latest
sudo docker start test-mysql-container

# TO RUN VIA DOCKER
sudo docker start b2e-rh-test-mysql-container
sudo docker build -t b2e-rh-backend .
sudo docker run --name b2e-rh-backend -p 7000:7000 --link b2e-rh-test-mysql-container:b2e-rh-test-mysql-container -d b2e-rh-backend

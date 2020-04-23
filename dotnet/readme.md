cd ./dotnet
docker build . -t docker-kubernetes-api
docker run -p 20001:80 docker-kubernetes-api:latest
http://localhost:20001/WeatherForecast
docker tag docker-kubernetes-api:latest {yourRepo}/docker-kubernetes-api:1.0.0 
docker push {yourRepo}/docker-kubernetes-api:1.0.0 


minikube start 
minikube dashboard

kubectl apply -f kubernetes.yml 
minikube service docker-kubernetes-api


*kubectl delete -f kubernetes.yml
*minikube dashboard
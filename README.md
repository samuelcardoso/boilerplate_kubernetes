# Links

https://learnk8s.io/nodejs-kubernetes-guide

# Commands

npm install
node index.js

docker build -t sample-js .
docker run sample-js
docker ps
docker exec -it e85369188781 bash

docker images
docker ps -a

docker login
docker tag sample-js samuelparacontato/sample-js:1.0.0
docker push samuelparacontato/sample-js:1.0.0

minikube start --memory=16384 --cpus=4
minikube dashboard
minikube ssh
kubectl get pods --watch

kubectl apply -f kubernetes-sample.yml
minikube service sample-js
kubectl scale --replicas=2 deployment/sample-js
kubectl delete kubernetes-sample.yml

# Custom Registry

docker stop cd58b0f7f71b
docker rmi -f cd58b0f7f71b
docker run -d -p 5000:5000 --restart=always --name registry registry

kubectl delete -f kube-registry.yml
kubectl create -f kube-registry.yml

kubectl port-forward --namespace kube-system \ $(kubectl get po -n kube-system | grep kube-registry-v0 | \awk '{print $1;}') 5000:5000

# Help commands

kubectl run sample-js --image=samuelparacontato/sample-js:1.0.0 --port=3000 --image-pull-policy=Never
kubectl expose deployment sample-js --type=LoadBalancer
kubectl get nodes --show-labels
minikube delete
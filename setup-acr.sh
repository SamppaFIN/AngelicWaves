#!/bin/bash

# Set variables
RESOURCE_GROUP="angelic-waves-rg"
LOCATION="eastus"
ACR_NAME="angelicwavesacr"
CONTAINER_APP_NAME="angelic-waves-app"
CONTAINER_APP_ENV="angelic-waves-env"

# Create resource group
az group create --name $RESOURCE_GROUP --location $LOCATION

# Create Azure Container Registry
az acr create --resource-group $RESOURCE_GROUP --name $ACR_NAME --sku Basic

# Enable admin user for ACR
az acr update -n $ACR_NAME --admin-enabled true

# Get ACR login server
ACR_LOGIN_SERVER=$(az acr show --name $ACR_NAME --resource-group $RESOURCE_GROUP --query "loginServer" --output tsv)

echo "ACR Login Server: $ACR_LOGIN_SERVER"

# Build and push Docker image
docker build -t $ACR_LOGIN_SERVER/angelic-waves:latest .
docker push $ACR_LOGIN_SERVER/angelic-waves:latest

# Create Container Apps environment
az containerapp env create \
  --name $CONTAINER_APP_ENV \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION

# Deploy to Container Apps
az containerapp create \
  --name $CONTAINER_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --environment $CONTAINER_APP_ENV \
  --image $ACR_LOGIN_SERVER/angelic-waves:latest \
  --target-port 5000 \
  --ingress external \
  --cpu 0.5 \
  --memory 1.0Gi \
  --min-replicas 1 \
  --max-replicas 3 \
  --env-vars NODE_ENV=production PORT=5000

echo "Deployment complete! Your app is available at:"
az containerapp show --name $CONTAINER_APP_NAME --resource-group $RESOURCE_APP_NAME --query "properties.configuration.ingress.fqdn" --output tsv

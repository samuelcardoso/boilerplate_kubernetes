FROM mcr.microsoft.com/dotnet/core/aspnet:3.1 AS base
WORKDIR /app

FROM mcr.microsoft.com/dotnet/core/sdk:3.1 AS build
WORKDIR /src
COPY ["docker-api.csproj", "./"]
RUN dotnet restore "./docker-api.csproj"
COPY . .
WORKDIR "/src/."
RUN dotnet build "docker-api.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "docker-api.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "docker-api.dll"]

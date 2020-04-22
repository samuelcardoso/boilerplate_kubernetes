SERVELESS (máquina liga quando requisição chega)

    GCP
    Azure
    AWS

    Vantagens:
        Autoscalling (Thresholds)
        Custo
        CPU (deu erro) -> Próxima requisição (Outra CPU)
    Desvantagens:
        ColdStart (tem que ligar)   -   Java Quarks (JVM)
        Servidor sem estado (????)

TRADICIONAL (máquina sempre ligada)

    ALB - Request (lock CPU) - Máquina alocada 100% (problema)
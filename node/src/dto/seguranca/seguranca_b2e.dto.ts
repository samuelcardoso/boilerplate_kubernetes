'use strict';

export class PermissaoB2EDTO {
    alterarNoticia: boolean;
    alterarBeneficio: boolean;
    enviarMensagem: boolean;

    plantasId: number[];
}

export class SegurancaB2EDTO {
    publicId: string;
    userPlantaId: number;
    userNivelId: number;
    isAdministradorGeral: boolean;
    isBackOffice: boolean;

    adminPermissoes?: PermissaoB2EDTO[];
}

export class LoginResponse {
    token: string;
    tokenSecurity: string;
    publicId: string;
    idUser: number;
    userPlantaId: number;
    userNivelId: number;
    adminPermissoes?: PermissaoB2EDTO[];
}

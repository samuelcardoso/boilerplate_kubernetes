'use strict';

export class UsuarioFCADTO {
    nome: string;
    matriculaemp: string;
    dataadmissao: string;
    categoriafuncional: string;
    nivel: string;
    situacaocadastral: number;
    codempresa: string;
    nomeempresa: string;
}

export class UserSecurityDTO {
    id: number;
    name: string;
    email: string;
    phone: string;
    publicId: string;
    sapId: number;
    networkLogin: string;
    active: boolean;
    companyId: number;
    company: string;
}

export class TokenSecurityDTO {
    user: UserSecurityDTO;
    iat: number;
}

export class UsuarioPeopleApiDTO {
    id: number;

    publicId: string; // numcpf

    codStatus: string; // sitafa
    desStatus: string; // dessit

    networkLogin: string; // loginfun
    registration: string; // numcad
    idSAP: string; // usu_idsap
    email: string; // endeel
    admissionDate: string; // datadm

    // Addresses
    addressTypeStreet: string;
    addressStreet: string; // endrua
    addressDistrict: string; // nombai
    addressHouseNumber: string;
    addressCompl: string;
    addressPostalZipCode: string; // endcep
    addressCity: string; // nomcid
    addressRegion: string;

    // Bank Information
    bank: string;
    bankPayee: string;
    bankKey: string;
    bankAccountNumber: string;
    bankPaymentMethod: string;
    bankPaymentCurrency: string;

    // Organizational Assignment
    orgAssigCodCompany: string; // numemp
    orgAssigNameCompany: string; // nomemp
    orgAssigCodBranch: string; // nomfil
    orgAssigNameBranch: string; // codfil
    orgAssigNameUnit: string; // nomloc
    orgAssigCodeUnit: string; // codloc
    orgAssigNameCategory: string; // natdes
    orgAssigCodeCategory: string; // nomnat
    orgAssigNamePosition: string; // titcar
    orgAssigCodePosition: string; // codcar
    orgAssigLevel: string; // grains
    orgAssigNameWorkload: string; // nomesc
    orgAssigCodeWorkload: string; // codesc
    orgAssigSeniority: string;
    orgAssigManager: string;
    orgAssigCountry: string;
    orgAssigNameSituation: string; // dessit
    orgAssigCodSituation: string; // codsit
    orgAssigJobDescription: string; // zzstell_txt

    gecMatrixLeadPositionCode: number; // zzplans_z10

    // Personal Data
    personalDataName: string; // nomfun
    personalDataGender: string; // tipsex
    personalDataBirthday: string; // datnas
    personalDataPlaceBirth: string;
    personalDataCountryBirth: string;
    personalDataCountry: string;
    personalDataState: string;
    personalDataMaritalStatus: string; // estciv
    personalDataLanguage: string;
    personalDataNationality: string;
    personalDataRace: string;
    personalDataNaturalizedCitizen: string;
    personalDataFatherName: string;
    personalDataMotherName: string;
    personalDataPhoneDDD: string; // dddtel
    personalDataPhoneNumber: string; // numtel
    personalDataCelDDD: string; // dddcel
    personalDataCelNumber: string; // numcel

    // Family Members
    familyMembDomesticPartner: string;
    familyMembBirthday: string;

    // Personal Ids
    personalIdsDrivingLicense: string;
    personalIdsIdentityNumber: string;
    personalIdsExpiryDate: string;

    // Documents Infotype
    documentsCPF: string;
    documentsIdentification: string;
    documentsIdIssuer: string;
    documentsWCSWNumber: string;
    documentsWCSWSerieNumber: string;
    documentsVoterRegCardNumber: string;
    documentsVoterRegCardArea: string;
    documentsPIS_PASEP: string;
    documentsReserveCertificate: string;
    documentsMilitaryType: string;
    documentsMilitaryCertifyNumber: string;
}

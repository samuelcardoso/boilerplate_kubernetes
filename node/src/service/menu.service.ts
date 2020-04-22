'use strict';

import { AutoWired, Inject } from 'typescript-ioc';
import { MenuDTO } from '../dto/menu/menu.dto';
import { SegurancaB2EDTO } from '../dto/seguranca/seguranca_b2e.dto';
import { NoticiaService } from './noticia.service';
import { BeneficioService } from './beneficio.service';
import { PesquisaService } from './pesquisa.service';
import { FCAExternal } from '../external/fca/fca.external';

@AutoWired
export class MenuService {

    @Inject
    private noticiaService: NoticiaService;

    @Inject
    private beneficiosService: BeneficioService;

    @Inject
    private pesquisaService: PesquisaService;

    @Inject
    private fcaExternal: FCAExternal;

    // TODO: Migrar para usar count
    public async listPermissions(segurancaB2EDTO: SegurancaB2EDTO, securityToken: string): Promise<MenuDTO> {
        const menuDTO = new MenuDTO();
        menuDTO.home = true;
        menuDTO.myAccount = true;
        menuDTO.search = true;

        const people = await this.fcaExternal.getUserPeopleAPI(
            securityToken,
            segurancaB2EDTO.publicId);

        await this.noticiaService.findByFilter(segurancaB2EDTO).then(records => {
            menuDTO.news = (records !== null && records.length > 0) ? true : false;
        });

        await this.beneficiosService.findByFilter(segurancaB2EDTO).then(records => {
            menuDTO.benefits = (records !== null && records.length > 0) ? true : false;
        });

        menuDTO.connect = (securityToken && securityToken.length > 0) ? true: false;

        menuDTO.way = false;
        if(segurancaB2EDTO.userPlantaId === 15) {
            menuDTO.way = true;
        }

        if(people) {
            if (people.publicId === '07303643648' || // Samuel
                people.publicId === '03641956650' || // Girley
                people.publicId === '06031220601' // Matheus
            ) {
                menuDTO.way = true;
            }

            if(people.gecMatrixLeadPositionCode === 50090451) {
                menuDTO.way = true;
            }

            if(people.gecMatrixLeadPositionCode === 50074119 &&
                (
                    people.orgAssigCodCompany === 'G355' ||
                    people.orgAssigCodCompany === 'G164'
                )) {
                menuDTO.way = true;
            }
        }

        await this.pesquisaService.findByFilter(segurancaB2EDTO).then(records => {
            menuDTO.survey = (records !== null && records.length > 0) ? true : false;
        });

        return Promise.resolve(menuDTO);
    }
}

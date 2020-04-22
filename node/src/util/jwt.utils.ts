import { Inject } from 'typescript-ioc';
import { Configuration } from '../config/configuration';
const jwtSimple = require('jwt-simple');
const nodeJose = require('node-jose');

export class ObjToken {
}

export class JWTUtils {

    private keystore: any;
    private jweDecript: any;
    private jwsVerify: any;
    private jweEncript: any;
    @Inject private config: Configuration;

    public decodeJWE(token: string): ObjToken {
        return jwtSimple.decode(token, this.config.jwt.secret);
    }

    public encodeJWE(usuarioFCADTO: ObjToken): string {
        return jwtSimple.encode(usuarioFCADTO, this.config.jwt.secret);
    }

    public async decodeJWS(token: string): Promise<ObjToken> {
        if (token && token.startsWith('Bearer ')) {
            token = token.substring(7);
        }
        const jwtDecript = await this.getJweDecript();
        const jwtVerify = await this.getJwsVerify();
        const result: any = await jwtDecript.decrypt(token);
        if (result && result.payload) {
            const jwt = await jwtVerify.verify(result.payload.toString());
            return JSON.parse(jwt.payload.toString());
        }
        throw new Error('Invalid payload for JWT token');
    }

    public async encodeJWS(jwtDTO: ObjToken): Promise<string> {
        const jwtEncript = await this.getJweEncript();
        const result: any = await jwtEncript.update(JSON.stringify(jwtDTO)).final();
        if (result) {
            return JSON.parse(result.plaintext);
        }
        throw new Error('Invalid payload for JWT token');
    }

    private async getKeyStore() {
        if (!this.keystore) {
            this.keystore = nodeJose.JWK.createKeyStore();
            await this.keystore.add({
                kty: 'oct',
                kid: 'SecurityKey',
                k: nodeJose.util.base64url.encode(this.config.jwt.secret)
            });
        }
        return this.keystore;
    }

    private async getJweDecript() {
        if (!this.jweDecript) {
            this.jweDecript =  nodeJose.JWE.createDecrypt(await this.getKeyStore());
        }
        return this.jweDecript;
    }

    private async getJwsVerify() {
        if (!this.jwsVerify) {
            this.jwsVerify =  nodeJose.JWS.createVerify(await this.getKeyStore());
        }
        return this.jwsVerify;
    }

    private async getJweEncript() {
        if (!this.jweEncript) {
            this.jweEncript =  nodeJose.JWE.createEncrypt(await this.getKeyStore());
        }
        return this.jweDecript;
    }
}

import { Inject } from 'typescript-ioc';
import { BasicModel } from './basic.model';
import { Logger } from '../logger/logger';

export abstract class BasicService<T extends BasicModel> {
    @Inject protected logger: Logger;

    async count(): Promise<number> {
        return new Promise<number>((resolve, reject) => {});
    }

    async findByFilter(
        filter: any,
    ): Promise<Array<T>> {
        return new Promise<Array<T>>((resolve, reject) => {});
    }

    async getByFilter(
        filter: any): Promise<T> {
        return new Promise<T>((resolve, reject) => {});   
    }

    async get(id: number): Promise<T> {
        return this.getByFilter(undefined);
    }

    async save(entity: T): Promise<number> {
        return 0;
    }

    async update(entity: T, id: number): Promise<void> {
    }

    async remove(id: number): Promise<void> {
        return new Promise<void>((resolve, reject) => {});
    }
}

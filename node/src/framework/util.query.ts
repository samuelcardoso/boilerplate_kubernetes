'use strict';

export enum JoinType {
    LeftJoinAndSelect,
    LeftJoin,
    InnerJoin,
    InnerJoinAndSelect
}

export class QueryFilters {
    constructor(joinFilters: JoinFilter[], havingFilters: HavingFilter[]) {
        this.joinFilters = joinFilters;
        this.havingFilters = havingFilters;
    }
    joinFilters: JoinFilter[];
    havingFilters: HavingFilter[];
}

export class OrderByAction {
    constructor(property: string, type: 'ASC' | 'DESC') {
        this.property = property;
        this.type = type;
    }
    property: string;
    type: 'ASC' | 'DESC';
}

export class LimitOffsetAction {
    constructor(limit?: number, offset?: number) {
        this.limit = limit;
        this.offset = offset;
    }
    limit?: number;
    offset?: number;
}

export class Parameter {
    constructor(key: string, value: string) {
        this.key = key;
        this.value = value;
    }
    key: string;
    value: string;
}

export class JoinFilter {
    constructor(property: string, alias: string, condition?: string, parameters?: Parameter[],joinType?: JoinType) {
        this.property = property;
        this.alias = alias;
        this.condition = condition;
        this.parameters = parameters;
        this.joinType = joinType;
    }
    property: string;
    alias: string;
    condition?: string;
    parameters?: Parameter[];
    joinType?: JoinType;
}

export class HavingFilter {
    constructor(having: string, parameters?: Parameter[], inclusive?: boolean) {
        this.having = having;
        this.parameters = parameters;
        this.inclusive = inclusive;
    }
    having: string;
    parameters?: Parameter[];
    inclusive: boolean;
}

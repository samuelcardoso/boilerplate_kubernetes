'use strict';

export class StringUtils {
    public static safeToUpperCase(value: string): string {
        if(!value) {
            return null;
        }
        return value.toLocaleUpperCase();
    }
}

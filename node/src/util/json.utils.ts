export class JSONUtils {
    public static merge(source1: any, source2: any): any {
        /*
        * Properties from the Souce1 object will be copied to Source2 Object.
        * Note: This method will return a new merged object, Source1 and Source2 original values will not be replaced.
        * */
        const mergedJSON = Object.create(source2);

        // Copying Source2 to a new Object
        for (const attrname in source1) {
            if(mergedJSON.hasOwnProperty(attrname)) {
                if ( source1[attrname]!==null && source1[attrname].constructor===Object ) {
                    /*
                    * Recursive call if the property is an object,
                    * Iterate the object and set all properties of the inner object.
                    */
                    mergedJSON[attrname] = this.merge(source1[attrname], mergedJSON[attrname]);
                }
            } else {
                // else copy the property from source1
                mergedJSON[attrname] = source1[attrname];
            }
        }

        return mergedJSON;
    }
}

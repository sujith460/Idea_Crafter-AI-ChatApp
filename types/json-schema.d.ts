declare module 'json-schema' {
  // Type declarations for json-schema
  export interface JSONSchema4 {
    id?: string;
    $schema?: string;
    title?: string;
    description?: string;
    default?: any;
    multipleOf?: number;
    maximum?: number;
    exclusiveMaximum?: boolean;
    minimum?: number;
    exclusiveMinimum?: boolean;
    maxLength?: number;
    minLength?: number;
    pattern?: string;
    additionalItems?: boolean | JSONSchema4;
    items?: JSONSchema4 | JSONSchema4[];
    maxItems?: number;
    minItems?: number;
    uniqueItems?: boolean;
    maxProperties?: number;
    minProperties?: number;
    required?: string[];
    additionalProperties?: boolean | JSONSchema4;
    definitions?: {
      [name: string]: JSONSchema4;
    };
    properties?: {
      [name: string]: JSONSchema4;
    };
    patternProperties?: {
      [name: string]: JSONSchema4;
    };
    dependencies?: {
      [name: string]: JSONSchema4 | string[];
    };
    enum?: any[];
    type?: string | string[];
    allOf?: JSONSchema4[];
    anyOf?: JSONSchema4[];
    oneOf?: JSONSchema4[];
    not?: JSONSchema4;
    $ref?: string;
    format?: string;
  }

  export interface JSONSchema6 extends JSONSchema4 {
    const?: any;
    contains?: JSONSchema4;
    propertyNames?: JSONSchema4;
  }

  export interface JSONSchema7 extends JSONSchema6 {
    $comment?: string;
    if?: JSONSchema4;
    then?: JSONSchema4;
    else?: JSONSchema4;
    contentMediaType?: string;
    contentEncoding?: string;
    readOnly?: boolean;
    writeOnly?: boolean;
  }

  export type JSONSchema = JSONSchema7;
}
export declare const jwtConfig: (() => {
    secret: string;
    accessExpiration: string;
    refreshExpiration: string;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    secret: string;
    accessExpiration: string;
    refreshExpiration: string;
}>;

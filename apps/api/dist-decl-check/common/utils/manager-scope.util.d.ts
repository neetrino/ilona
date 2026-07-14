import { JwtPayload } from '../types/auth.types';
export declare function getManagerCenterIdOrThrow(user: JwtPayload | undefined): string | undefined;
export declare function assertManagerCenterAccess(user: JwtPayload | undefined, requestedCenterId: string | undefined | null): string | undefined;

import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { JwtPayload } from '../../../common/types/auth.types';
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly usersService;
    private readonly logger;
    constructor(configService: ConfigService, usersService: UsersService);
    private logAuthDiagnostics;
    private isDatabaseConnectionError;
    validate(payload: JwtPayload): Promise<JwtPayload>;
}
export {};

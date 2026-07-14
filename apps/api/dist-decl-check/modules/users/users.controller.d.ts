import { UsersService } from './users.service';
import { JwtPayload } from '../../common/types/auth.types';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateManagerDto } from './dto/create-manager.dto';
import { UpdateManagerDto } from './dto/update-manager.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getMe(user: JwtPayload): Promise<unknown>;
    updateMe(user: JwtPayload, dto: UpdateUserDto): Promise<unknown>;
    findAll(): Promise<unknown>;
    findManagers(): Promise<unknown>;
    createManager(dto: CreateManagerDto): Promise<unknown>;
    updateManager(id: string, dto: UpdateManagerDto): Promise<unknown>;
    findOne(id: string): Promise<unknown>;
}

import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    findAll(): Promise<import("./entities/user.entity").User[]>;
    create(createDto: CreateUserDto): Promise<import("./entities/user.entity").User>;
    update(id: number, updateDto: UpdateUserDto): Promise<import("./entities/user.entity").User>;
}

"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = require("bcrypt");
const user_entity_1 = require("./entities/user.entity");
let UsersService = class UsersService {
    constructor(usersRepository) {
        this.usersRepository = usersRepository;
    }
    async findByUsername(username) {
        return this.usersRepository.findOne({ where: { username } });
    }
    async findById(id) {
        return this.usersRepository.findOne({ where: { id } });
    }
    async findAll() {
        return this.usersRepository.find();
    }
    async create(createDto) {
        const existingUser = await this.findByUsername(createDto.username);
        if (existingUser) {
            throw new common_1.ConflictException('Username already exists');
        }
        const passwordHash = await bcrypt.hash(createDto.password, 10);
        const user = this.usersRepository.create({
            username: createDto.username,
            password_hash: passwordHash,
            name: createDto.name,
            last_name: createDto.last_name,
            role: createDto.role,
            phone: createDto.phone,
            email: createDto.email,
            language_pref: createDto.language_preference,
        });
        return this.usersRepository.save(user);
    }
    async update(id, updateDto) {
        const user = await this.findById(id);
        if (!user) {
            throw new common_1.NotFoundException(`User with ID ${id} not found`);
        }
        if (updateDto.password) {
            user.password_hash = await bcrypt.hash(updateDto.password, 10);
        }
        if (updateDto.name !== undefined)
            user.name = updateDto.name;
        if (updateDto.last_name !== undefined)
            user.last_name = updateDto.last_name;
        if (updateDto.role !== undefined)
            user.role = updateDto.role;
        if (updateDto.phone !== undefined)
            user.phone = updateDto.phone;
        if (updateDto.email !== undefined)
            user.email = updateDto.email;
        if (updateDto.language_preference !== undefined)
            user.language_pref = updateDto.language_preference;
        return this.usersRepository.save(user);
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], UsersService);
//# sourceMappingURL=users.service.js.map
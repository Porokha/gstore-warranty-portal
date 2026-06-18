import { Injectable, ConflictException, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findByUsername(username: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.password_hash')
      .where('user.username = :username', { username })
      .getOne();
  }

  async findById(id: number): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async findByIdWithPassword(id: number): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.password_hash')
      .where('user.id = :id', { id })
      .getOne();
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async findTechnicians(): Promise<User[]> {
    return this.usersRepository.find({
      where: { role: UserRole.TECHNICIAN },
      order: {
        name: 'ASC',
        last_name: 'ASC',
        username: 'ASC',
      },
    });
  }

  async create(createDto: CreateUserDto): Promise<User> {
    // Check if username already exists
    const existingUser = await this.findByUsername(createDto.username);
    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(createDto.password, 10);

    // Create user
    const user = this.usersRepository.create({
      username: createDto.username,
      password_hash: passwordHash,
      name: createDto.name,
      last_name: createDto.last_name,
      role: createDto.role,
      phone: createDto.phone,
      email: createDto.email,
      language_pref: createDto.language_preference,
      must_change_password: Boolean(createDto.must_change_password),
    });

    return this.usersRepository.save(user);
  }

  async update(id: number, updateDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Update password if provided
    if (updateDto.password) {
      user.password_hash = await bcrypt.hash(updateDto.password, 10);
    }

    // Update other fields
    if (updateDto.name !== undefined) user.name = updateDto.name;
    if (updateDto.last_name !== undefined) user.last_name = updateDto.last_name;
    if (updateDto.role !== undefined) user.role = updateDto.role;
    if (updateDto.phone !== undefined) user.phone = updateDto.phone;
    if (updateDto.email !== undefined) user.email = updateDto.email;
    if (updateDto.language_preference !== undefined) user.language_pref = updateDto.language_preference;
    if (updateDto.must_change_password !== undefined) {
      user.must_change_password = Boolean(updateDto.must_change_password);
    }

    return this.usersRepository.save(user);
  }

  async changeOwnPassword(
    userId: number,
    currentPassword: string | undefined,
    newPassword: string,
  ): Promise<User> {
    const user = await this.findByIdWithPassword(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (!newPassword || newPassword.length < 6) {
      throw new BadRequestException('New password must be at least 6 characters');
    }

    if (!user.must_change_password) {
      if (!currentPassword) {
        throw new BadRequestException('Current password is required');
      }

      const matches = await bcrypt.compare(currentPassword, user.password_hash);
      if (!matches) {
        throw new ForbiddenException('Current password is incorrect');
      }
    }

    user.password_hash = await bcrypt.hash(newPassword, 10);
    user.must_change_password = false;
    const savedUser = await this.usersRepository.save(user);
    delete (savedUser as any).password_hash;
    return savedUser;
  }
}

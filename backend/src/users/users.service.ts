import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { username } });
  }

  async findById(id: number): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
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

    return this.usersRepository.save(user);
  }
}


import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { StaffNotification } from './entities/staff-notification.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { ServiceCase } from '../cases/entities/service-case.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(StaffNotification)
    private notificationsRepository: Repository<StaffNotification>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async notifyManagersCasePending(case_: ServiceCase): Promise<void> {
    const managers = await this.usersRepository.find({
      where: { role: UserRole.MANAGER },
      select: ['id'],
    });

    if (managers.length === 0) return;

    const notifications = managers.map((manager) =>
      this.notificationsRepository.create({
        recipient_user_id: manager.id,
        case_id: case_.id,
        case_number: case_.case_number,
        type: 'case_pending',
        title: `Case ${case_.case_number} is pending`,
        message: case_.result_type === 'payable'
          ? 'Technician work is complete and the case is waiting for customer payment.'
          : 'Technician work is complete and the case is waiting for customer action.',
      }),
    );

    await this.notificationsRepository.save(notifications);
  }

  async findForUser(userId: number): Promise<StaffNotification[]> {
    return this.notificationsRepository.find({
      where: { recipient_user_id: userId },
      order: { created_at: 'DESC' },
      take: 30,
    });
  }

  async getUnreadCount(userId: number): Promise<{ count: number }> {
    const count = await this.notificationsRepository.count({
      where: { recipient_user_id: userId, read_at: IsNull() },
    });
    return { count };
  }

  async markRead(id: number, userId: number): Promise<void> {
    await this.notificationsRepository.update(
      { id, recipient_user_id: userId },
      { read_at: new Date() },
    );
  }

  async markAllRead(userId: number): Promise<void> {
    await this.notificationsRepository.update(
      { recipient_user_id: userId, read_at: IsNull() },
      { read_at: new Date() },
    );
  }
}

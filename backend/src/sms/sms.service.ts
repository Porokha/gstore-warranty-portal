import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SmsTemplate } from './entities/sms-template.entity';
import { SmsSettings } from './entities/sms-settings.entity';
import { SmsLog } from './entities/sms-log.entity';

@Injectable()
export class SmsService {
  constructor(
    @InjectRepository(SmsTemplate)
    private templatesRepository: Repository<SmsTemplate>,
    @InjectRepository(SmsSettings)
    private settingsRepository: Repository<SmsSettings>,
    @InjectRepository(SmsLog)
    private logsRepository: Repository<SmsLog>,
  ) {}
}


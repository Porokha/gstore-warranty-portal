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
exports.FilesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const path_1 = require("path");
const fs_1 = require("fs");
const case_file_entity_1 = require("./entities/case-file.entity");
const service_case_entity_1 = require("../cases/entities/service-case.entity");
let FilesService = class FilesService {
    constructor(filesRepository, casesRepository) {
        this.filesRepository = filesRepository;
        this.casesRepository = casesRepository;
        this.uploadsDir = (0, path_1.join)(process.cwd(), 'uploads');
        if (!(0, fs_1.existsSync)(this.uploadsDir)) {
            (0, fs_1.mkdirSync)(this.uploadsDir, { recursive: true });
        }
    }
    detectFileType(filename) {
        const ext = filename.toLowerCase().split('.').pop();
        const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
        const videoExts = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'];
        const pdfExts = ['pdf'];
        if (imageExts.includes(ext)) {
            return case_file_entity_1.FileType.IMAGE;
        }
        if (videoExts.includes(ext)) {
            return case_file_entity_1.FileType.VIDEO;
        }
        if (pdfExts.includes(ext)) {
            return case_file_entity_1.FileType.PDF;
        }
        return case_file_entity_1.FileType.OTHER;
    }
    async uploadFile(caseId, file, uploadedBy) {
        const case_ = await this.casesRepository.findOne({
            where: { id: caseId },
        });
        if (!case_) {
            throw new common_1.NotFoundException(`Case with ID ${caseId} not found`);
        }
        const fileUrl = `/uploads/cases/${caseId}/${file.filename}`;
        const fileType = this.detectFileType(file.originalname);
        const caseFile = this.filesRepository.create({
            case_id: caseId,
            file_url: fileUrl,
            file_type: fileType,
            uploaded_by: uploadedBy,
        });
        return this.filesRepository.save(caseFile);
    }
    async findAllByCase(caseId) {
        const case_ = await this.casesRepository.findOne({
            where: { id: caseId },
        });
        if (!case_) {
            throw new common_1.NotFoundException(`Case with ID ${caseId} not found`);
        }
        return this.filesRepository.find({
            where: { case_id: caseId },
            relations: ['uploaded_by_user'],
            order: { created_at: 'DESC' },
        });
    }
    async findOne(id) {
        const file = await this.filesRepository.findOne({
            where: { id },
            relations: ['case_', 'uploaded_by_user'],
        });
        if (!file) {
            throw new common_1.NotFoundException(`File with ID ${id} not found`);
        }
        return file;
    }
    async remove(id) {
        const file = await this.findOne(id);
        const filePath = (0, path_1.join)(process.cwd(), file.file_url);
        if ((0, fs_1.existsSync)(filePath)) {
            (0, fs_1.unlinkSync)(filePath);
        }
        await this.filesRepository.remove(file);
    }
    getFilePath(fileUrl) {
        return (0, path_1.join)(process.cwd(), fileUrl);
    }
};
exports.FilesService = FilesService;
exports.FilesService = FilesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(case_file_entity_1.CaseFile)),
    __param(1, (0, typeorm_1.InjectRepository)(service_case_entity_1.ServiceCase)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], FilesService);
//# sourceMappingURL=files.service.js.map
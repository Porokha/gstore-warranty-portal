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
exports.PublicController = void 0;
const common_1 = require("@nestjs/common");
const public_service_1 = require("./public.service");
const search_warranty_dto_1 = require("./dto/search-warranty.dto");
const search_case_dto_1 = require("./dto/search-case.dto");
let PublicController = class PublicController {
    constructor(publicService) {
        this.publicService = publicService;
    }
    searchWarranty(searchDto) {
        return this.publicService.searchWarranty(searchDto);
    }
    searchCase(searchDto) {
        return this.publicService.searchCase(searchDto);
    }
};
exports.PublicController = PublicController;
__decorate([
    (0, common_1.Post)('search/warranty'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [search_warranty_dto_1.SearchWarrantyDto]),
    __metadata("design:returntype", void 0)
], PublicController.prototype, "searchWarranty", null);
__decorate([
    (0, common_1.Post)('search/case'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [search_case_dto_1.SearchCaseDto]),
    __metadata("design:returntype", void 0)
], PublicController.prototype, "searchCase", null);
exports.PublicController = PublicController = __decorate([
    (0, common_1.Controller)('public'),
    __metadata("design:paramtypes", [public_service_1.PublicService])
], PublicController);
//# sourceMappingURL=public.controller.js.map
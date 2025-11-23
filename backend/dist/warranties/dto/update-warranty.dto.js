"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateWarrantyDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_warranty_dto_1 = require("./create-warranty.dto");
class UpdateWarrantyDto extends (0, mapped_types_1.PartialType)(create_warranty_dto_1.CreateWarrantyDto) {
}
exports.UpdateWarrantyDto = UpdateWarrantyDto;
//# sourceMappingURL=update-warranty.dto.js.map
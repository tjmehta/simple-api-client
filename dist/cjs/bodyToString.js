"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BodyStringifyError = void 0;
const baseerr_1 = __importDefault(require("baseerr"));
class BodyStringifyError extends baseerr_1.default {
}
exports.BodyStringifyError = BodyStringifyError;
function bodyToString(body) {
    try {
        return JSON.stringify(body);
    }
    catch (_err) {
        const err = _err;
        throw BodyStringifyError.wrap(err, 'cannot stringify body', {
            body,
        });
    }
}
exports.default = bodyToString;
//# sourceMappingURL=bodyToString.js.map
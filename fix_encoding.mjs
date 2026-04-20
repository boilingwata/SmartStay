import { readFileSync, writeFileSync } from 'fs';

const raw = readFileSync('src/views/admin/contracts/CreateContractWizard.tsx', 'utf8');
const lines = raw.split('\n');

// Line 1153 (index 1152): finalAcknowledgement label
lines[1152] = `                    label="Tôi đồng ý lưu vết cam kết này trong hợp đồng và chịu trách nhiệm về tính chính xác của thông tin."`;

// Line 1160 (index 1159): Người ký xác nhận
lines[1159] = `                    Người ký xác nhận: {getValues('ownerRep.fullName') || 'Chưa có'}.`;

// Line 1162 (index 1161): Căn cứ hiện tại
lines[1161] = `                    Căn cứ hiện tại: {TEN_CAN_CU_PHAP_LY[legalBasisType]}.`;

// Line 1164 (index 1163): Số hồ sơ đính kèm
lines[1163] = `                    Số hồ sơ đính kèm: {supportingDocumentUrls?.length ?? 0}.`;

// Line 1165 (index 1164): Ghi chú
lines[1164] = `                    {legalBasisNote ? <span> Ghi chú: {legalBasisNote}</span> : null}`;

writeFileSync('src/views/admin/contracts/CreateContractWizard.tsx', lines.join('\n'), 'utf8');
console.log('Done - all encoding errors fixed!');

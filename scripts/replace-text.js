/**
 * Script tự động thay đổi text từ nước hoa sang đồ án
 * Usage: node scripts/replace-text.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const replacements = {
  // Vietnamese - Case sensitive
  'nước hoa': 'đồ án',
  'Nước hoa': 'Đồ án',
  'Nước Hoa': 'Đồ Án',
  'NƯỚC HOA': 'ĐỒ ÁN',
  
  'sản phẩm': 'đồ án',
  'Sản phẩm': 'Đồ án',
  'Sản Phẩm': 'Đồ Án',
  'SẢN PHẨM': 'ĐỒ ÁN',
  
  'mùi hương': 'tính năng',
  'Mùi hương': 'Tính năng',
  'Mùi Hương': 'Tính Năng',
  
  'thương hiệu': 'môn học',
  'Thương hiệu': 'Môn học',
  'Thương Hiệu': 'Môn Học',
  
  'dung tích': 'bao gồm',
  'Dung tích': 'Bao gồm',
  'Dung Tích': 'Bao Gồm',
  
  'nốt hương': 'công nghệ',
  'Nốt hương': 'Công nghệ',
  'Nốt Hương': 'Công Nghệ',
  
  'hương thơm': 'chất lượng',
  'Hương thơm': 'Chất lượng',
  'Hương Thơm': 'Chất Lượng',
  
  'độ lưu hương': 'độ hoàn thiện',
  'Độ lưu hương': 'Độ hoàn thiện',
  
  'chai': 'bộ',
  'Chai': 'Bộ',
  
  'xịt thử': 'xem demo',
  'Xịt thử': 'Xem demo',
  
  // English - Variables, functions, types
  'perfume': 'project',
  'Perfume': 'Project',
  'PERFUME': 'PROJECT',
  
  'product': 'project',
  'Product': 'Project',
  'PRODUCT': 'PROJECT',
  
  'scent': 'feature',
  'Scent': 'Feature',
  'SCENT': 'FEATURE',
  
  'brand': 'subject',
  'Brand': 'Subject',
  'BRAND': 'SUBJECT',
  
  'volume': 'includes',
  'Volume': 'Includes',
  'VOLUME': 'INCLUDES',
  
  'fragrance': 'quality',
  'Fragrance': 'Quality',
  'FRAGRANCE': 'QUALITY',
  
  'bottle': 'package',
  'Bottle': 'Package',
  'BOTTLE': 'PACKAGE',
  
  // Specific phrases
  'Thêm vào giỏ': 'Thêm vào giỏ', // Giữ nguyên
  'Mua ngay': 'Mua & Tải về',
  'Mua sắm': 'Khám phá',
  'Giao hàng': 'Giao file',
  'Nhận hàng': 'Nhận file',
  'Đặt hàng': 'Đặt mua',
  'Sản phẩm trong giỏ': 'Đồ án trong giỏ',
  'sản phẩm trong giỏ': 'đồ án trong giỏ',
};

const excludeDirs = ['node_modules', 'dist', 'build', '.git', '.next', 'coverage'];
const excludeFiles = ['.min.js', '.min.css', 'replace-text.js', 'package-lock.json'];

function shouldProcessFile(filePath) {
  const ext = path.extname(filePath);
  const allowedExts = ['.tsx', '.ts', '.jsx', '.js', '.css', '.html', '.md', '.json'];
  
  if (!allowedExts.includes(ext)) return false;
  
  const fileName = path.basename(filePath);
  if (excludeFiles.some(exclude => fileName.includes(exclude))) return false;
  
  return true;
}

function replaceInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    const originalContent = content;
    
    Object.entries(replacements).forEach(([find, replace]) => {
      // Escape special regex characters
      const escapedFind = find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escapedFind, 'g');
      
      if (regex.test(content)) {
        content = content.replace(regex, replace);
        changed = true;
      }
    });
    
    if (changed && content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function walkDir(dir, callback, baseDir = dir) {
  try {
    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const relativePath = path.relative(baseDir, fullPath);
      
      // Skip excluded directories
      if (excludeDirs.some(exclude => relativePath.includes(exclude))) {
        return;
      }
      
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        walkDir(fullPath, callback, baseDir);
      } else if (stat.isFile() && shouldProcessFile(fullPath)) {
        callback(fullPath);
      }
    });
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error.message);
  }
}

// Main execution
console.log('🔄 Starting text replacement...\n');

const srcDir = path.join(__dirname, '..', 'src');
const rootDir = path.join(__dirname, '..');

let totalFiles = 0;
let changedFiles = 0;

// Process src directory
walkDir(srcDir, (filePath) => {
  totalFiles++;
  if (replaceInFile(filePath)) {
    changedFiles++;
    console.log(`✅ Updated: ${path.relative(rootDir, filePath)}`);
  }
});

// Process root files
const rootFiles = ['index.html', 'README.md', 'package.json'];
rootFiles.forEach(file => {
  const filePath = path.join(rootDir, file);
  if (fs.existsSync(filePath)) {
    totalFiles++;
    if (replaceInFile(filePath)) {
      changedFiles++;
      console.log(`✅ Updated: ${file}`);
    }
  }
});

console.log(`\n📊 Summary:`);
console.log(`   Total files processed: ${totalFiles}`);
console.log(`   Files changed: ${changedFiles}`);
console.log(`\n✅ Text replacement completed!`);
console.log(`\n⚠️  Please review changes and test the application.`);

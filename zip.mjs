import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { ZipArchive } from 'archiver';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));


// Caminho para o diretório do tema
const themePath = __dirname;

// Obter o nome do tema a partir do package.json
const packageInfo = require('./package.json');
const themeName = packageInfo.name+'_'+new Date().getTime();

// Arquivos e diretórios a serem excluídos do zip
const excludePatterns = [
  '.tanstack',
  '.wrangler',
  'dist',
  'node_modules/**',
  '.env',
  '.git/**',
  '.gitignore',
  'package-lock.json',
  'zip.mjs'
];

// Criar o diretório build se não existir
const buildDir = path.join(themePath, 'build');
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir);
}

// Criar um arquivo de saída para gravar o zip
const output = fs.createWriteStream(path.join(buildDir, `${themeName}.zip`));
const archive = new ZipArchive({ zlib: { level: 9 } });

// Capturar eventos do arquivo
output.on('close', () => {
  console.log(`\nZip do tema criado com sucesso: ${themeName}.zip`);
  console.log(`Tamanho total: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`);
});

archive.on('warning', (err) => {
  if (err.code === 'ENOENT') {
    console.warn('Aviso:', err);
  } else {
    throw err;
  }
});

archive.on('error', (err) => {
  throw err;
});

// Conectar o arquivo ao archiver
archive.pipe(output);

// Função para verificar se um caminho deve ser excluído
function shouldExclude(filePath) {
  filePath = filePath.replace(/\\/g, '/'); // Normalizar para o formato Unix
  return excludePatterns.some(pattern => {
    // Converter o padrão para regex
    const regexPattern = pattern
      .replace(/\./g, '\\.')
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*');
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(filePath);
  });
}

// Função recursiva para adicionar arquivos ao zip
function addDirectoryToArchive(dirPath, archivePath = '') {
  const items = fs.readdirSync(dirPath);
  
  items.forEach(item => {
    const fullPath = path.join(dirPath, item);
    const relativePath = path.join(archivePath, item);
    
    // Verificar se o item deve ser excluído
    if (shouldExclude(relativePath)) {
      return;
    }
    
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // Adicionar diretório e seus conteúdos recursivamente
      addDirectoryToArchive(fullPath, relativePath);
    } else if (stat.isFile()) {
      // Adicionar arquivo ao zip
      archive.file(fullPath, { name: relativePath });
      console.log(`Adicionando: ${relativePath}`);
    }
  });
}

console.log('Criando zip do tema...');
addDirectoryToArchive(themePath);

// Finalizar o arquivo
archive.finalize();

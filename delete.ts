import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

interface StatsWithIndex extends fs.Stats {
  [key: string]: any;
}

async function isFileOrDirectory(path: string, type: 'isFile' | 'isDirectory'): Promise<boolean> {
  const getFileDetails = promisify(fs.lstat);
  const details: StatsWithIndex = await getFileDetails(path);
  return details[type]();
}

async function getFilePaths(folderPath: string, rootFolderPath: string): Promise<any> {
  const readAsync = promisify(fs.readdir);
  const fullPath = path.join(rootFolderPath, folderPath);
  if (await isFileOrDirectory(fullPath, 'isFile')) {
    return fullPath;
  } else if (await isFileOrDirectory(fullPath, 'isDirectory')) {
    const nestedPaths = await readAsync(fullPath);
    return Promise.all(
      nestedPaths
        .filter((filePath: string) => !(filePath === 'node_modules'))
        .map((deepPaths: string) => getFilePaths(deepPaths, fullPath))
    );
  }
}

async function main(folderPath: string) {
  console.log('Searching for files to delete...');
  const paths = await getFilePaths(folderPath, '');
  const specRegex = /\.spec\.ts$/i;

  const filesToDelete = paths.flat(Infinity).filter((path: string) => specRegex.test(path));
  filesToDelete.forEach((file: string) => {
    const deleteFileAsync = promisify(fs.unlink);
    deleteFileAsync(file);
  });

  return filesToDelete.length;
}

const folderPassedAsArgument = process.argv[2];
main(folderPassedAsArgument)
  .then((numberOfFilesDeleted: number) => {
    console.log(`${numberOfFilesDeleted} files deleted.`);
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

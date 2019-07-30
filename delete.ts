import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const isDirectory = async (path: string): Promise<boolean> => {
  const getFileDetails = promisify(fs.lstat);
  const details = await getFileDetails(path);
  return details.isDirectory();
};

const isFile = async (path: string): Promise<boolean> => {
  const getFileDetails = promisify(fs.lstat);
  const details = await getFileDetails(path);
  return details.isFile();
};

const getFilePaths = async (folderPath: string, rootFolderPath: string): Promise<any> => {
  const readAsync = promisify(fs.readdir);
  const fullPath = path.join(rootFolderPath, folderPath);
  if (await isFile(fullPath)) {
    return fullPath;
  } else if (await isDirectory(fullPath)) {
    const nestedPaths = await readAsync(fullPath);
    return Promise.all(
      nestedPaths
        .filter((filePath: string) => !(filePath === 'node_modules'))
        .map((deepPaths: string) => getFilePaths(deepPaths, fullPath))
    );
  }
};

const main = async (folderPath: string) => {
  console.log('Searching for files to delete...');
  const paths = await getFilePaths(folderPath, '');
  const specRegex = /\.spec\.ts$/i;

  const filesToDelete = paths.flat(Infinity).filter((path: string) => specRegex.test(path));
  filesToDelete.forEach((file: string) => {
    const deleteFileAsync = promisify(fs.unlink);
    deleteFileAsync(file);
  });

  return filesToDelete.length;
};

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

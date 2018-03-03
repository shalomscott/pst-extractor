import { PSTMessage } from './app/PSTMessage/PSTMessage.class';
import { PSTFile } from './app/PSTFile/PSTFile.class';
import { PSTFolder } from './app/PSTFolder/PSTFolder.class';
import { Log } from './app/Log.class';
import { PSTAttachment } from './app/PSTAttachment/PSTAttachment.class';
import * as fs from 'fs';
import * as fsext from 'fs-ext';

let depth = -1;

const start = Date.now();
let pstFile = new PSTFile('/home/ed/Desktop/outlook/2005-02.pst');
pstFile.open();
console.log(pstFile.getMessageStore().getDisplayName());
processFolder(pstFile.getRootFolder());
const end = Date.now();
console.log('processed in ' + (end - start) + ' ms');

function processFolder(folder: PSTFolder) {
    depth++;

    // the root folder doesn't have a display name
    if (depth > 0) {
        console.log(getDepth(depth) + folder.getDisplayName());
    }

    // go through the folders...
    if (folder.hasSubfolders()) {
        let childFolders: PSTFolder[] = folder.getSubFolders();
        for (let childFolder of childFolders) {
            processFolder(childFolder);
        }
    }

    // and now the emails for this folder
    if (folder.getContentCount() > 0) {
        depth++;
        let email: PSTMessage = folder.getNextChild();
        while (email != null) {
            console.log(getDepth(depth) + 'Email: ' + email.getDescriptorNodeId() + ' - ' + email.subject);
            if (email.hasAttachments) {
                Log.debug1('has attachments!');
                for (let i = 0; i < email.numberOfAttachments; i++) {
                    let attachment: PSTAttachment = email.getAttachment(i);
                    Log.debug1(attachment.toJSONstring());
                    if (attachment.filename) {
                        let filename = '/home/ed/Desktop/outlook/' + attachment.filename;
                        let fd = fsext.openSync(this.pstFilename, 'w');
                        console.log(filename);
                        let attachmentStream = attachment.fileInputStream;
                        let bufferSize = 8176;
                        let buffer = new Buffer(bufferSize);
                        let bytesRead;
                        do {
                            bytesRead = attachmentStream.read(buffer);
                            fsext.writeSync(fd, buffer);
                        } while (bytesRead == bufferSize);
                        fsext.closeSync(fd);
                    }
                }
            }
            email = folder.getNextChild();
        }
        depth--;
    }

    depth--;
}

function getDepth(depth: number): string {
    let sdepth = '';
    for (let x = 0; x < depth - 1; x++) {
        sdepth += ' | ';
    }
    sdepth += ' |- ';
    return sdepth;
}

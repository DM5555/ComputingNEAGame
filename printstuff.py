#CODE PRINTER MADE BY DOMINIC MUNN
#EXPORT TO PDF USING SIZE 12 CONSOLAS.
#PRINT
#DO NOT RUN THIS MORE THAN ONCE WITHOUT DELETING GENERATED RESULTS AS IT WILL RECURSIVELY DOUBLE YOUR OUTPUT
#ALL FILES MUST BE UTF-8 COMPLIANT OR IT WILL CRASH
import os
import math
validExtensions = [
    ".json",
    ".js",
    ".ts",
    ".html",
    ".css",
    ".bat",
    ".txt",
    ".sql",
    ".md",
    ".py",
    ".java",
    ".cpp",
    ".c",
    ".h",
    ".cs"
] #List of extensions of files that should be printed.

def formatFile(filepath):
    f = open(filepath, encoding="utf-8")
    rl = f.read().splitlines()
    if len(rl)>0:
        buffer = "#"*math.floor((73-len(filepath))/2) + filepath + "#"*math.ceil((73-len(filepath))/2) #Header
        lineNumberLength = math.floor(math.log10(len(rl)))+1
        maxlength = 71-lineNumberLength
        lineNumber = 1
        for line in rl:
            buffer += "\n" + str(lineNumber) + " "*(lineNumberLength-len(str(lineNumber))) + "|"
            i=0
            for c in line:
                if i>0 and i%maxlength==0: #Line limit reached
                    buffer+="\n"+(" "*lineNumberLength)+"|"
                buffer+=c
                i+=1
            lineNumber+=1
        buffer+="\n"
        return buffer
    else:
        return ""
            

details = input("Enter header details including name and candidate number: ")

fileData = ""
output = ""
for dirr, subdirs, files in os.walk("."): #Index core directory
    for filename in files:
        name,extension = os.path.splitext(filename) #Split name and extension
        if extension in validExtensions:
            fileData += formatFile(os.path.join(dirr,filename))
lineNo=0
pageNo=1
for fd in fileData.splitlines():
    if lineNo%49==0:
        pageData = "Page " + str(pageNo) + "\n"
        output += details + (" "*((73-len(details))-len(pageData))) + pageData
        output += "="*72+"\n"
        lineNo+=2
        pageNo+=1
    output+=fd + "\n"
    lineNo+=1
        

outfile = open("./output.txt","w")
outfile.write(output)
outfile.close()
####END OF CODE PRINTER###

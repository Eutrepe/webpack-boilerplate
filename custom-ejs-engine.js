import ejs from 'ejs';
import FS from 'fs';

export function renderTemplate(templatePath, templateParameters) {
  const template = FS.readFileSync(templatePath, 'utf8');
  return ejs.render(template, templateParameters, {
    delimiter: '%',
    openDelimiter: '<',
    closeDelimiter: '>'
  });
}
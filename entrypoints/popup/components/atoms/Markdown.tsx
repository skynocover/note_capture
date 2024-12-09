import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import * as FileSaver from 'file-saver';
import * as XLSX from 'xlsx';

import { Button } from '../ui/button';

export const MarkdownComponent = ({ content }: { content: string }) => {
  return (
    <div className="prose prose-sm max-w-none dark:prose-invert">
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={{
          table: ({ children }) => {
            const parseTable = () => {
              let csv_str_list: Array<Array<string>> = [];

              const thead = (children as any[])[0];
              const thead_tr = Array.isArray(thead.props.children)
                ? thead.props.children
                : [thead.props.children];

              for (const tr of thead_tr) {
                const tr_th = Array.isArray(tr.props.children)
                  ? tr.props.children
                  : [tr.props.children];

                csv_str_list.push(tr_th.map((th: any) => th.props.children));
              }

              const tbody = (children as any[])[1];
              const tbody_tr = Array.isArray(tbody.props.children)
                ? tbody.props.children
                : [tbody.props.children];

              for (const tr of tbody_tr) {
                const tr_td = Array.isArray(tr.props.children)
                  ? tr.props.children
                  : [tr.props.children];

                csv_str_list.push(tr_td.map((td: any) => td.props.children));
              }

              const wb = XLSX.utils.book_new();
              const ws = XLSX.utils.aoa_to_sheet(csv_str_list);
              XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

              const excelBuffer = XLSX.write(wb, {
                bookType: 'xlsx',
                type: 'array',
              });
              const dataBlob = new Blob([excelBuffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
              });

              FileSaver.saveAs(dataBlob, 'Twitter Pilot.xlsx');
            };

            return (
              <div className="w-full my-5">
                <Button onClick={parseTable}>{'Download Table'}</Button>
                <table>{children}</table>
              </div>
            );
          },
        }}
      >
        {content}
      </Markdown>
    </div>
  );
};

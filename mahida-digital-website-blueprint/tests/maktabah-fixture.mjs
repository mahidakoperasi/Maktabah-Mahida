export function kitabDocument(version = "awal") {
  const text = (content, style = {}) => ({
    textRun: { content: `${content}\n`, textStyle: style },
  });
  const paragraph = (startIndex, content, heading, headingId) => ({
    startIndex,
    paragraph: {
      paragraphStyle: heading
        ? { namedStyleType: `HEADING_${heading}`, headingId }
        : {},
      elements: [text(content)],
    },
  });
  return {
    title: "Kitab Uji Google Docs",
    tabs: [
      {
        tabProperties: { tabId: "t.utama", title: "Kitab" },
        documentTab: {
          body: {
            content: [
              paragraph(1, "Bab Pertama", 1, "h.bab1"),
              paragraph(
                20,
                `Pengantar ${version}. Teks Indonesia dengan بِسْمِ اللَّهِ di tengah kalimat.`,
              ),
              paragraph(100, "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ"),
              paragraph(200, "Subbab Pertama", 2, "h.sub1"),
              paragraph(240, "Bagian Lanjutan", 3, "h.bagian1"),
              {
                startIndex: 270,
                paragraph: {
                  bullet: { listId: "list1", nestingLevel: 0 },
                  elements: [text("Poin pertama")],
                },
              },
              {
                startIndex: 290,
                paragraph: {
                  bullet: { listId: "list1", nestingLevel: 0 },
                  elements: [text("Poin kedua")],
                },
              },
              {
                startIndex: 310,
                table: {
                  tableRows: [
                    {
                      tableCells: [
                        { content: [paragraph(320, "Sel tabel Arab العربية")] },
                        { content: [paragraph(350, "Sel tabel kedua")] },
                      ],
                    },
                  ],
                },
              },
              {
                startIndex: 370,
                paragraph: {
                  elements: [
                    text("Teks tebal", { bold: true }),
                    text("tautan berbahaya", {
                      link: { url: "javascript:alert(1)" },
                    }),
                    {
                      footnoteReference: {
                        footnoteId: "fn1",
                        footnoteNumber: "7",
                      },
                    },
                  ],
                },
              },
              paragraph(400, "Bab Kedua", 1, "h.bab2"),
              ...Array.from({ length: 20 }, (_, i) =>
                paragraph(
                  420 + i * 100,
                  `Paragraf ${i + 1}. ${"Isi kitab yang panjang untuk pengujian posisi bacaan. ".repeat(8)}`,
                ),
              ),
            ],
          },
          lists: {
            list1: {
              listProperties: { nestingLevels: [{ glyphType: "DECIMAL" }] },
            },
          },
          footnotes: {
            fn1: {
              content: [
                paragraph(9000, "Catatan sumber dan penjelasan kitab."),
                ...(version === "catatanpanjang"
                  ? Array.from({ length: 28 }, (_, i) =>
                      paragraph(
                        9100 + i * 100,
                        `Penjelasan lanjutan ${i + 1}. ${"Catatan penjelas kitab untuk pembaca. ".repeat(5)}`,
                      ),
                    )
                  : []),
                {
                  startIndex: 9020,
                  paragraph: {
                    elements: [
                      text("Catatan rujukan بِسْمِ اللَّهِ", { bold: true }),
                    ],
                  },
                },
              ],
            },
          },
        },
        childTabs: [
          {
            tabProperties: { tabId: "t.tambahan", title: "Lampiran" },
            documentTab: {
              body: {
                content: [
                  paragraph(1, "Lampiran Kitab", 1, "h.lampiran"),
                  paragraph(30, "Isi lampiran."),
                ],
              },
            },
          },
        ],
      },
    ],
  };
}

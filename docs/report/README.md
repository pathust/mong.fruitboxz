# Báo cáo Project II — Mọng Fruitboxz

Tài liệu được viết bằng XeLaTeX, gồm 6 chương, sơ đồ Draw.io có thể chỉnh sửa và ảnh chụp trực tiếp từ phiên chạy thử của dự án.

## Cấu trúc

```text
docs/report/
├── main.tex                  # entry point
├── main.pdf                  # bản PDF đã biên dịch
├── chapters/                 # nội dung từng chương
├── diagrams/                 # nguồn .drawio
└── images/                   # logo, ảnh giao diện và PNG nhúng Draw.io
```

Các sơ đồ chính gồm use case tổng quan, kiến trúc logic, mô-đun nghiệp vụ, triển khai, sequence checkout, sequence chatbot và ERD logic. File `*.drawio.png` chứa XML nhúng nên có thể mở lại bằng draw.io để chỉnh sửa.

## Biên dịch

Yêu cầu XeLaTeX/TeX Live và font Times New Roman:

```bash
cd docs/report
make
```

Hoặc dùng trình biên dịch của plugin LaTeX:

```bash
python3 /path/to/latex-plugin/scripts/compile_latex.py \
  /absolute/path/to/docs/report/main.tex --engine xelatex
```

## Cập nhật sơ đồ

Chỉnh file trong `diagrams/`, sau đó xuất PNG có nhúng dữ liệu:

```bash
drawio -x -f png -e -s 2 \
  -o images/architecture.drawio.png diagrams/architecture.drawio
python3 /path/to/drawio-skill/scripts/repair_png.py \
  images/architecture.drawio.png
```

Sau khi đổi nội dung hoặc hình ảnh, chạy lại `make` để cập nhật mục lục, số hình và tham chiếu.

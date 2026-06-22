# ============================================================
#  Makefile – Báo Cáo Project II
# ============================================================

MAIN     = main
COMPILER = xelatex
FLAGS    = -interaction=nonstopmode -halt-on-error
OUTDIR   = .

.PHONY: all clean open

# Default target: build PDF (2 passes for TOC & refs)
all:
	$(COMPILER) $(FLAGS) $(MAIN).tex
	$(COMPILER) $(FLAGS) $(MAIN).tex
	@echo ""
	@echo "✅  Build thành công! File: $(MAIN).pdf"

# Open PDF after build (Linux/macOS)
open: all
	@if command -v xdg-open >/dev/null 2>&1; then \
	  xdg-open $(MAIN).pdf; \
	elif command -v open >/dev/null 2>&1; then \
	  open $(MAIN).pdf; \
	else \
	  echo "Mở file $(MAIN).pdf bằng PDF viewer của bạn."; \
	fi

# Clean auxiliary files
clean:
	rm -f *.aux *.log *.toc *.out *.fls *.fdb_latexmk \
	      *.synctex.gz *.bbl *.blg *.idx *.ilg *.ind \
	      chapters/*.aux
	@echo "🧹  Đã xóa file tạm."

# Full clean (including PDF)
distclean: clean
	rm -f $(MAIN).pdf
	@echo "🗑️   Đã xóa cả file PDF."

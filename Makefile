all: build

.PHONY: clean deploy


build: index.html
	npm install

clean:
	rm -rf lib node_modules package-lock.json

update-markupchisel:
	npm update markupchisel
	npm install


HOST := s.zeid.me
DIR  := ~/srv/www/bnay.me/srv/_/note-tab

deploy:
	ssh $(HOST) 'cd $(DIR); pwd; git pull && git submodule update && make'

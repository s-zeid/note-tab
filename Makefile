all: index.html

.PHONY: wbn clean deploy


wbn: note-tab.wbn
note-tab.wbn: url := https://note-tab.bnay.me/
note-tab.wbn: main.html main.css main.js utils.js LICENSE.txt README.md
	mkdir -p wbn-tmp
	cp -pr $^ wbn-tmp/
	mv wbn-tmp/main.html wbn-tmp/index.html
	gen-bundle \
	 -headerOverride 'Access-Control-Allow-Origin: *' \
	 -dir wbn-tmp -baseURL "${url}" -primaryURL "${url}" \
	 -o note-tab.wbn; \
	 r=$$?; rm -rf wbn-tmp; [ $$r -eq 0 ] && true || false


clean:
	rm -f note-tab.wbn


HOST := s.zeid.me
DIR  := ~/srv/www/bnay.me/_/note-tab

deploy:
	ssh $(HOST) 'cd $(DIR); pwd; git pull && git submodule update && make && make wbn'

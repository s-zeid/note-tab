all: index.html

.PHONY: clean deploy


clean:
	rm -f note-tab.wbn


HOST := s.zeid.me
DIR  := ~/srv/www/bnay.me/srv/_/note-tab

deploy:
	ssh $(HOST) 'cd $(DIR); pwd; git pull && git submodule update && make'

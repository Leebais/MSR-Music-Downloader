const sqlite3 = require('sqlite3').verbose();
const {
    randomInt,
} = require('node:crypto');
async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const cookie = "_ga=GA1.1.829591125.1735309953; _ga_W23PCBGJKK=GS1.1.1735309953.1.1.1735313327.0.0.0";


class Database {
    constructor() {
        this.db = new sqlite3.Database('./db.db'); // 使用内存中的数据库，你也可以指定一个文件路径
    }

    async createTables() {
        await this.db.run("CREATE TABLE albums (cid TEXT, name TEXT, intro TEXT, belong TEXT, coverUrl TEXT, coverDeUrl TEXT)");
        await this.db.run("CREATE TABLE songs (cid TEXT, name TEXT, albumCid TEXT, sourceUrl TEXT, lyricUrl TEXT, mvUrl TEXT, mvCoverUrl TEXT, artists TEXT)");
        await this.db.run("CREATE TABLE artists (name TEXT)");
    }

    async insertAlbum(album) {
        await this.db.run("INSERT INTO albums (cid, name, intro, belong, coverUrl, coverDeUrl) VALUES (?, ?, ?, ?, ?, ?)", [album.cid, album.name, album.intro, album.belong, album.coverUrl, album.coverDeUrl]);
    }

    async insertSong(song) {
        await this.db.run("INSERT INTO songs (cid, name, albumCid, sourceUrl, lyricUrl, mvUrl, mvCoverUrl, artists) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [song.cid, song.name, song.albumCid, song.sourceUrl, song.lyricUrl, song.mvUrl, song.mvCoverUrl, JSON.stringify(song.artists)]);
    }

    async insertArtist(artist) {
        await this.db.run("INSERT INTO artists (name) VALUES (?)", [artist]);
    }

    async updateAlbum(album) {
        await this.db.run("UPDATE albums SET name = ?, intro = ?, belong = ?, coverUrl = ?, coverDeUrl = ? WHERE cid = ?", [album.name, album.intro, album.belong, album.coverUrl, album.coverDeUrl, album.cid]);
    }

    async updateSong(song) {
        await this.db.run("UPDATE songs SET name = ?, sourceUrl = ?, lyricUrl = ?, mvUrl = ?, mvCoverUrl = ?, artists = ? WHERE cid = ?", [song.name, song.sourceUrl, song.lyricUrl, song.mvUrl, song.mvCoverUrl, JSON.stringify(song.artists), song.cid]);
    }

    async deleteAlbum(cid) {
        await this.db.run("DELETE FROM albums WHERE cid = ?", [cid]);
    }

    async deleteSong(cid) {
        await this.db.run("DELETE FROM songs WHERE cid = ?", [cid]);
    }

    async queryAlbums(cid) {
        let sql_command = '';
        if (cid === undefined) {
            sql_command = 'SELECT * FROM albums';
        } else {
            sql_command = `SELECT * FROM albums WHERE cid = '${cid}'`;
        }
        return new Promise((resolve, reject) => {
            this.db.all(sql_command, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    async querySongs(cid) {
        let sql_command = '';
        if (cid === undefined) {
            sql_command = 'SELECT * FROM songs';
        } else {
            sql_command = `SELECT * FROM songs WHERE cid = '${cid}'`;
        }

        return new Promise((resolve, reject) => {
            this.db.all(sql_command, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    async queryArtist(name) {
        let sql_command = '';
        if (name === undefined) {
            sql_command = 'SELECT * FROM artists';
        } else {
            sql_command = `SELECT * FROM artists WHERE name = '${name}'`;
        }

        return new Promise((resolve, reject) => {
            this.db.all(sql_command, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    async close() {
        await this.db.close();
    }
}


class Semaphore {
    constructor(max) {
        this.max = max;
        this.counter = 0;
        this.queue = [];
    }

    async acquire() {
        if (this.counter < this.max) {
            this.counter++;
            if (this.counter === 1) {
                await sleep(500);
            }
        } else {
            await new Promise(resolve => this.queue.push(resolve));
        }
    }

    async release() {
        this.counter--;
        await sleep(randomInt(300, 3000));
        if (this.queue.length > 0) {
            const resolve = this.queue.shift();
            resolve();
            this.counter++;
        }
    }

    async runWithSemaphore(fn) {
        await this.acquire();
        let resp;
        try {
            resp = await fn();
        } finally {
            this.release();
            return resp;
        }
    }

}
const semaphore = new Semaphore(1);
const semaphore2 = new Semaphore(2);
const semaphore3 = new Semaphore(4);
const db = new Database();
async function fetchAlbums() {
    const response = await fetch("https://monster-siren.hypergryph.com/api/albums", {
        "headers": {
            "accept": "*/*",
            "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
            "priority": "u=1, i",
            "sec-ch-ua": "\"Microsoft Edge\";v=\"131\", \"Chromium\";v=\"131\", \"Not_A Brand\";v=\"24\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "cookie": cookie,
            "Referer": "https://monster-siren.hypergryph.com/music",
            "Referrer-Policy": "strict-origin-when-cross-origin"
        },
        "body": null,
        "method": "GET"
    });
    const temp = await response.json();

    return temp.data;
}

async function fetchAlbumDetail(id) {
    const response = await fetch(`https://monster-siren.hypergryph.com/api/album/${id}/detail`, {
        "headers": {
            "accept": "*/*",
            "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
            "priority": "u=1, i",
            "sec-ch-ua": "\"Microsoft Edge\";v=\"131\", \"Chromium\";v=\"131\", \"Not_A Brand\";v=\"24\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "cookie": cookie,
            "Referer": "https://monster-siren.hypergryph.com/music",
            "Referrer-Policy": "strict-origin-when-cross-origin"
        },
        "body": null,
        "method": "GET"
    });
    let data = await response.json();
    data = data.data;
    const res = await db.queryAlbums(data.cid);
    // 插入 albums 表中的数据
    if (res.length !== 0) {
        await db.updateAlbum(data);
    } else {
        await db.insertAlbum(data);
    }
    const songs = data.songs;

    await Promise.all(songs.map(song => semaphore2.runWithSemaphore(() => fetchSongInfo(song.cid))));

}

async function fetchSongInfo(id) {
    const response = await fetch("https://monster-siren.hypergryph.com/api/song/" + id, {
        "headers": {
            "accept": "*/*",
            "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
            "priority": "u=1, i",
            "sec-ch-ua": "\"Microsoft Edge\";v=\"131\", \"Chromium\";v=\"131\", \"Not_A Brand\";v=\"24\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "cookie": cookie,
            "Referer": "https://monster-siren.hypergryph.com/music/" + id,
            "Referrer-Policy": "strict-origin-when-cross-origin"
        },
        "body": null,
        "method": "GET"
    });
    let data = await response.json();
    data = data.data;

    const res = await db.querySongs(data.cid);
    // 插入 albums 表中的数据
    if (res.length !== 0) {
        await db.updateSong(data);
    } else {
        await db.insertSong(data);
    }

    data.artists.forEach(async element => {
        const res = await db.queryArtist(element);
        // 插入 albums 表中的数据
        if (res.length === 0) {
            await db.insertArtist(element);
        }
    });


}
async function fetchAllAlbumsDetail(cids) {
    await Promise.all(cids.map(cid => semaphore.runWithSemaphore(() => fetchAlbumDetail(cid.cid))));
}
async function main() {
    // db.createTables();
    // console.log("Hello World!");
    const albums = await fetchAlbums();
    // 

    await fetchAlbumDetail(albums[0].cid);
    await fetchAlbumDetail(albums[1].cid);
    await fetchAlbumDetail(albums[2].cid);
    await fetchAlbumDetail(albums[3].cid);
    await fetchAlbumDetail(albums[4].cid);
    await fetchAlbumDetail(albums[5].cid);
    await fetchAlbumDetail(albums[6].cid);
    await fetchAlbumDetail(albums[7].cid);
    await fetchAlbumDetail(albums[8].cid);
    await fetchAlbumDetail(albums[9].cid);

}
main();
"use client";
import React, { useRef } from "react";
import styles from "@/styles/main/center/Posts.module.css";
import {
  PlusIcon,
  MoreIcon,
  DownIcon,
  TopIcon,
  ShareMoreIcon,
} from "@/components/FlatIcons";

export default function Posts() {
  return (
    <>
      <div className={styles.miraPost}>
        <div className={styles.miraHead}>
          <img src="/test-1.jpg" alt="Avatar" className={styles.avatar} />
          <div className={styles.usernameDiv}>
            <span className={styles.username}>Username</span>
            <span className={styles.username}>@username</span>
          </div>
        </div>
        <p
          className={styles.miraPostInput}
          style={{ overflow: "hidden", resize: "none" }}
        >
          azerarzerazere azerrazreaerzrerzerzujiosdfjuiçdfhuisj huh
          fbfdhbufbhubhufb huh fbfdhbufbhubhufb hfdh ubfbdhufybdhshbfsdhbu
          bfhsdhbu fsdh ufdshb
          uhbfdbudfshbudfbhufhbfdbhsdfbuqhbuhfsbuhbfhusdqbuhqfsdbhuhbufsdhb
          ufdhb udfs hh fsdh fds hfd hfd azerarzerazere azerrazreh{" "}
        </p>
        <div className={styles.miraPostActions}>
          <div className={styles.buttonLeft}>
            <button className={styles.icons} aria-label="Monter">
              <TopIcon />
              top
            </button>
            <button className={styles.icons} aria-label="Descendre">
              <DownIcon />
              down
            </button>
            <button className={styles.icons} aria-label="Partager">
              <ShareMoreIcon />
            </button>
            <button className={styles.icons} aria-label="Ajouter une image">
              <PlusIcon />
            </button>
            <button className={styles.icons} aria-label="Plus d'options">
              <MoreIcon />
            </button>
          </div>
        </div>
      </div>{" "}
      <div className={styles.miraPost}>
        <div className={styles.miraHead}>
          <img src="/test-1.jpg" alt="Avatar" className={styles.avatar} />
          <div className={styles.usernameDiv}>
            <span className={styles.username}>Username</span>
            <span className={styles.username}>@username</span>
          </div>
        </div>
        <p
          className={styles.miraPostInput}
          style={{ overflow: "hidden", resize: "none" }}
        >
          azerarzerazere azerrazreaerzrerzerzujiosdfjuiçdfhuisj huh
          fbfdhbufbhubhufb huh fbfdhbufbhubhufb hfdh ubfbdhufybdhshbfsdhbu
          bfhsdhbu fsdh ufdshb
          uhbfdbudfshbudfbhufhbfdbhsdfbuqhbuhfsbuhbfhusdqbuhqfsdbhuhbufsdhb
          ufdhb udfs hh fsdh fds hfd hfd azerarzerazere azerrazreh{" "}
        </p>
        <div className={styles.miraPostActions}>
          <div className={styles.buttonLeft}>
            <button className={styles.icons} aria-label="Monter">
              <TopIcon />
              top
            </button>
            <button className={styles.icons} aria-label="Descendre">
              <DownIcon />
              down
            </button>
            <button className={styles.icons} aria-label="Partager">
              <ShareMoreIcon />
            </button>
            <button className={styles.icons} aria-label="Ajouter une image">
              <PlusIcon />
            </button>
            <button className={styles.icons} aria-label="Plus d'options">
              <MoreIcon />
            </button>
          </div>
        </div>
      </div>{" "}
      <div className={styles.miraPost}>
        <div className={styles.miraHead}>
          <img src="/test-1.jpg" alt="Avatar" className={styles.avatar} />
          <div className={styles.usernameDiv}>
            <span className={styles.username}>Username</span>
            <span className={styles.username}>@username</span>
          </div>
        </div>
        <p
          className={styles.miraPostInput}
          style={{ overflow: "hidden", resize: "none" }}
        >
          azerarzerazere azerrazreaerzrerzerzujiosdfjuiçdfhuisj huh
          fbfdhbufbhubhufb huh fbfdhbufbhubhufb hfdh ubfbdhufybdhshbfsdhbu
          bfhsdhbu fsdh ufdshb
          uhbfdbudfshbudfbhufhbfdbhsdfbuqhbuhfsbuhbfhusdqbuhqfsdbhuhbufsdhb
          ufdhb udfs hh fsdh fds hfd hfd azerarzerazere azerrazreh{" "}
        </p>
        <div className={styles.miraPostActions}>
          <div className={styles.buttonLeft}>
            <button className={styles.icons} aria-label="Monter">
              <TopIcon />
              top
            </button>
            <button className={styles.icons} aria-label="Descendre">
              <DownIcon />
              down
            </button>
            <button className={styles.icons} aria-label="Partager">
              <ShareMoreIcon />
            </button>
            <button className={styles.icons} aria-label="Ajouter une image">
              <PlusIcon />
            </button>
            <button className={styles.icons} aria-label="Plus d'options">
              <MoreIcon />
            </button>
          </div>
        </div>
      </div>{" "}
      <div className={styles.miraPost}>
        <div className={styles.miraHead}>
          <img src="/test-1.jpg" alt="Avatar" className={styles.avatar} />
          <div className={styles.usernameDiv}>
            <span className={styles.username}>Username</span>
            <span className={styles.username}>@username</span>
          </div>
        </div>
        <p
          className={styles.miraPostInput}
          style={{ overflow: "hidden", resize: "none" }}
        >
          azerarzerazere azerrazreaerzrerzerzujiosdfjuiçdfhuisj huh
          fbfdhbufbhubhufb huh fbfdhbufbhubhufb hfdh ubfbdhufybdhshbfsdhbu
          bfhsdhbu fsdh ufdshb
          uhbfdbudfshbudfbhufhbfdbhsdfbuqhbuhfsbuhbfhusdqbuhqfsdbhuhbufsdhb
          ufdhb udfs hh fsdh fds hfd hfd azerarzerazere azerrazreh{" "}
        </p>
        <div className={styles.miraPostActions}>
          <div className={styles.buttonLeft}>
            <button className={styles.icons} aria-label="Monter">
              <TopIcon />
              top
            </button>
            <button className={styles.icons} aria-label="Descendre">
              <DownIcon />
              down
            </button>
            <button className={styles.icons} aria-label="Partager">
              <ShareMoreIcon />
            </button>
            <button className={styles.icons} aria-label="Ajouter une image">
              <PlusIcon />
            </button>
            <button className={styles.icons} aria-label="Plus d'options">
              <MoreIcon />
            </button>
          </div>
        </div>
      </div>{" "}
      <div className={styles.miraPost}>
        <div className={styles.miraHead}>
          <img src="/test-1.jpg" alt="Avatar" className={styles.avatar} />
          <div className={styles.usernameDiv}>
            <span className={styles.username}>Username</span>
            <span className={styles.username}>@username</span>
          </div>
        </div>
        <p
          className={styles.miraPostInput}
          style={{ overflow: "hidden", resize: "none" }}
        >
          azerarzerazere azerrazreaerzrerzerzujiosdfjuiçdfhuisj huh
          fbfdhbufbhubhufb huh fbfdhbufbhubhufb hfdh ubfbdhufybdhshbfsdhbu
          bfhsdhbu fsdh ufdshb
          uhbfdbudfshbudfbhufhbfdbhsdfbuqhbuhfsbuhbfhusdqbuhqfsdbhuhbufsdhb
          ufdhb udfs hh fsdh fds hfd hfd azerarzerazere azerrazreh{" "}
        </p>
        <div className={styles.miraPostActions}>
          <div className={styles.buttonLeft}>
            <button className={styles.icons} aria-label="Monter">
              <TopIcon />
              top
            </button>
            <button className={styles.icons} aria-label="Descendre">
              <DownIcon />
              down
            </button>
            <button className={styles.icons} aria-label="Partager">
              <ShareMoreIcon />
            </button>
            <button className={styles.icons} aria-label="Ajouter une image">
              <PlusIcon />
            </button>
            <button className={styles.icons} aria-label="Plus d'options">
              <MoreIcon />
            </button>
          </div>
        </div>
      </div>{" "}
      <div className={styles.miraPost}>
        <div className={styles.miraHead}>
          <img src="/test-1.jpg" alt="Avatar" className={styles.avatar} />
          <div className={styles.usernameDiv}>
            <span className={styles.username}>Username</span>
            <span className={styles.username}>@username</span>
          </div>
        </div>
        <p
          className={styles.miraPostInput}
          style={{ overflow: "hidden", resize: "none" }}
        >
          azerarzerazere azerrazreaerzrerzerzujiosdfjuiçdfhuisj huh
          fbfdhbufbhubhufb huh fbfdhbufbhubhufb hfdh ubfbdhufybdhshbfsdhbu
          bfhsdhbu fsdh ufdshb
          uhbfdbudfshbudfbhufhbfdbhsdfbuqhbuhfsbuhbfhusdqbuhqfsdbhuhbufsdhb
          ufdhb udfs hh fsdh fds hfd hfd azerarzerazere azerrazreh{" "}
        </p>
        <div className={styles.miraPostActions}>
          <div className={styles.buttonLeft}>
            <button className={styles.icons} aria-label="Monter">
              <TopIcon />
              top
            </button>
            <button className={styles.icons} aria-label="Descendre">
              <DownIcon />
              down
            </button>
            <button className={styles.icons} aria-label="Partager">
              <ShareMoreIcon />
            </button>
            <button className={styles.icons} aria-label="Ajouter une image">
              <PlusIcon />
            </button>
            <button className={styles.icons} aria-label="Plus d'options">
              <MoreIcon />
            </button>
          </div>
        </div>
      </div>{" "}
      <div className={styles.miraPost}>
        <div className={styles.miraHead}>
          <img src="/test-1.jpg" alt="Avatar" className={styles.avatar} />
          <div className={styles.usernameDiv}>
            <span className={styles.username}>Username</span>
            <span className={styles.username}>@username</span>
          </div>
        </div>
        <p
          className={styles.miraPostInput}
          style={{ overflow: "hidden", resize: "none" }}
        >
          azerarzerazere azerrazreaerzrerzerzujiosdfjuiçdfhuisj huh
          fbfdhbufbhubhufb huh fbfdhbufbhubhufb hfdh ubfbdhufybdhshbfsdhbu
          bfhsdhbu fsdh ufdshb
          uhbfdbudfshbudfbhufhbfdbhsdfbuqhbuhfsbuhbfhusdqbuhqfsdbhuhbufsdhb
          ufdhb udfs hh fsdh fds hfd hfd azerarzerazere azerrazreh{" "}
        </p>
        <div className={styles.miraPostActions}>
          <div className={styles.buttonLeft}>
            <button className={styles.icons} aria-label="Monter">
              <TopIcon />
              top
            </button>
            <button className={styles.icons} aria-label="Descendre">
              <DownIcon />
              down
            </button>
            <button className={styles.icons} aria-label="Partager">
              <ShareMoreIcon />
            </button>
            <button className={styles.icons} aria-label="Ajouter une image">
              <PlusIcon />
            </button>
            <button className={styles.icons} aria-label="Plus d'options">
              <MoreIcon />
            </button>
          </div>
        </div>
      </div>{" "}
      <div className={styles.miraPost}>
        <div className={styles.miraHead}>
          <img src="/test-1.jpg" alt="Avatar" className={styles.avatar} />
          <div className={styles.usernameDiv}>
            <span className={styles.username}>Username</span>
            <span className={styles.username}>@username</span>
          </div>
        </div>
        <p
          className={styles.miraPostInput}
          style={{ overflow: "hidden", resize: "none" }}
        >
          azerarzerazere azerrazreaerzrerzerzujiosdfjuiçdfhuisj huh
          fbfdhbufbhubhufb huh fbfdhbufbhubhufb hfdh ubfbdhufybdhshbfsdhbu
          bfhsdhbu fsdh ufdshb
          uhbfdbudfshbudfbhufhbfdbhsdfbuqhbuhfsbuhbfhusdqbuhqfsdbhuhbufsdhb
          ufdhb udfs hh fsdh fds hfd hfd azerarzerazere azerrazreh{" "}
        </p>
        <div className={styles.miraPostActions}>
          <div className={styles.buttonLeft}>
            <button className={styles.icons} aria-label="Monter">
              <TopIcon />
              top
            </button>
            <button className={styles.icons} aria-label="Descendre">
              <DownIcon />
              down
            </button>
            <button className={styles.icons} aria-label="Partager">
              <ShareMoreIcon />
            </button>
            <button className={styles.icons} aria-label="Ajouter une image">
              <PlusIcon />
            </button>
            <button className={styles.icons} aria-label="Plus d'options">
              <MoreIcon />
            </button>
          </div>
        </div>
      </div>{" "}
      <div className={styles.miraPost}>
        <div className={styles.miraHead}>
          <img src="/test-1.jpg" alt="Avatar" className={styles.avatar} />
          <div className={styles.usernameDiv}>
            <span className={styles.username}>Username</span>
            <span className={styles.username}>@username</span>
          </div>
        </div>
        <p
          className={styles.miraPostInput}
          style={{ overflow: "hidden", resize: "none" }}
        >
          azerarzerazere azerrazreaerzrerzerzujiosdfjuiçdfhuisj huh
          fbfdhbufbhubhufb huh fbfdhbufbhubhufb hfdh ubfbdhufybdhshbfsdhbu
          bfhsdhbu fsdh ufdshb
          uhbfdbudfshbudfbhufhbfdbhsdfbuqhbuhfsbuhbfhusdqbuhqfsdbhuhbufsdhb
          ufdhb udfs hh fsdh fds hfd hfd azerarzerazere azerrazreh{" "}
        </p>
        <div className={styles.miraPostActions}>
          <div className={styles.buttonLeft}>
            <button className={styles.icons} aria-label="Monter">
              <TopIcon />
              top
            </button>
            <button className={styles.icons} aria-label="Descendre">
              <DownIcon />
              down
            </button>
            <button className={styles.icons} aria-label="Partager">
              <ShareMoreIcon />
            </button>
            <button className={styles.icons} aria-label="Ajouter une image">
              <PlusIcon />
            </button>
            <button className={styles.icons} aria-label="Plus d'options">
              <MoreIcon />
            </button>
          </div>
        </div>
      </div>{" "}
      <div className={styles.miraPost}>
        <div className={styles.miraHead}>
          <img src="/test-1.jpg" alt="Avatar" className={styles.avatar} />
          <div className={styles.usernameDiv}>
            <span className={styles.username}>Username</span>
            <span className={styles.username}>@username</span>
          </div>
        </div>
        <p
          className={styles.miraPostInput}
          style={{ overflow: "hidden", resize: "none" }}
        >
          azerarzerazere azerrazreaerzrerzerzujiosdfjuiçdfhuisj huh
          fbfdhbufbhubhufb huh fbfdhbufbhubhufb hfdh ubfbdhufybdhshbfsdhbu
          bfhsdhbu fsdh ufdshb
          uhbfdbudfshbudfbhufhbfdbhsdfbuqhbuhfsbuhbfhusdqbuhqfsdbhuhbufsdhb
          ufdhb udfs hh fsdh fds hfd hfd azerarzerazere azerrazreh{" "}
        </p>
        <div className={styles.miraPostActions}>
          <div className={styles.buttonLeft}>
            <button className={styles.icons} aria-label="Monter">
              <TopIcon />
              top
            </button>
            <button className={styles.icons} aria-label="Descendre">
              <DownIcon />
              down
            </button>
            <button className={styles.icons} aria-label="Partager">
              <ShareMoreIcon />
            </button>
            <button className={styles.icons} aria-label="Ajouter une image">
              <PlusIcon />
            </button>
            <button className={styles.icons} aria-label="Plus d'options">
              <MoreIcon />
            </button>
          </div>
        </div>
      </div>{" "}
      <div className={styles.miraPost}>
        <div className={styles.miraHead}>
          <img src="/test-1.jpg" alt="Avatar" className={styles.avatar} />
          <div className={styles.usernameDiv}>
            <span className={styles.username}>Username</span>
            <span className={styles.username}>@username</span>
          </div>
        </div>
        <p
          className={styles.miraPostInput}
          style={{ overflow: "hidden", resize: "none" }}
        >
          azerarzerazere azerrazreaerzrerzerzujiosdfjuiçdfhuisj huh
          fbfdhbufbhubhufb huh fbfdhbufbhubhufb hfdh ubfbdhufybdhshbfsdhbu
          bfhsdhbu fsdh ufdshb
          uhbfdbudfshbudfbhufhbfdbhsdfbuqhbuhfsbuhbfhusdqbuhqfsdbhuhbufsdhb
          ufdhb udfs hh fsdh fds hfd hfd azerarzerazere azerrazreh{" "}
        </p>
        <div className={styles.miraPostActions}>
          <div className={styles.buttonLeft}>
            <button className={styles.icons} aria-label="Monter">
              <TopIcon />
              top
            </button>
            <button className={styles.icons} aria-label="Descendre">
              <DownIcon />
              down
            </button>
            <button className={styles.icons} aria-label="Partager">
              <ShareMoreIcon />
            </button>
            <button className={styles.icons} aria-label="Ajouter une image">
              <PlusIcon />
            </button>
            <button className={styles.icons} aria-label="Plus d'options">
              <MoreIcon />
            </button>
          </div>
        </div>
      </div>{" "}
      <div className={styles.miraPost}>
        <div className={styles.miraHead}>
          <img src="/test-1.jpg" alt="Avatar" className={styles.avatar} />
          <div className={styles.usernameDiv}>
            <span className={styles.username}>Username</span>
            <span className={styles.username}>@username</span>
          </div>
        </div>
        <p
          className={styles.miraPostInput}
          style={{ overflow: "hidden", resize: "none" }}
        >
          azerarzerazere azerrazreaerzrerzerzujiosdfjuiçdfhuisj huh
          fbfdhbufbhubhufb huh fbfdhbufbhubhufb hfdh ubfbdhufybdhshbfsdhbu
          bfhsdhbu fsdh ufdshb
          uhbfdbudfshbudfbhufhbfdbhsdfbuqhbuhfsbuhbfhusdqbuhqfsdbhuhbufsdhb
          ufdhb udfs hh fsdh fds hfd hfd azerarzerazere azerrazreh{" "}
        </p>
        <div className={styles.miraPostActions}>
          <div className={styles.buttonLeft}>
            <button className={styles.icons} aria-label="Monter">
              <TopIcon />
              top
            </button>
            <button className={styles.icons} aria-label="Descendre">
              <DownIcon />
              down
            </button>
            <button className={styles.icons} aria-label="Partager">
              <ShareMoreIcon />
            </button>
            <button className={styles.icons} aria-label="Ajouter une image">
              <PlusIcon />
            </button>
            <button className={styles.icons} aria-label="Plus d'options">
              <MoreIcon />
            </button>
          </div>
        </div>
      </div>
      <div className={styles.miraPost}>
        <div className={styles.miraHead}>
          <img src="/test-1.jpg" alt="Avatar" className={styles.avatar} />
          <div className={styles.usernameDiv}>
            <span className={styles.username}>Username</span>
            <span className={styles.username}>@username</span>
          </div>
        </div>
        <p
          className={styles.miraPostInput}
          style={{ overflow: "hidden", resize: "none" }}
        >
          azerarzerazere azerrazreaerzrerzerzujiosdfjuiçdfhuisj huh
          fbfdhbufbhubhufb huh fbfdhbufbhubhufb hfdh ubfbdhufybdhshbfsdhbu
          bfhsdhbu fsdh ufdshb
          uhbfdbudfshbudfbhufhbfdbhsdfbuqhbuhfsbuhbfhusdqbuhqfsdbhuhbufsdhb
          ufdhb udfs hh fsdh fds hfd hfd azerarzerazere azerrazreh{" "}
        </p>
        <div className={styles.miraPostActions}>
          <div className={styles.buttonLeft}>
            <button className={styles.icons} aria-label="Monter">
              <TopIcon />
              top
            </button>
            <button className={styles.icons} aria-label="Descendre">
              <DownIcon />
              down
            </button>
            <button className={styles.icons} aria-label="Partager">
              <ShareMoreIcon />
            </button>
            <button className={styles.icons} aria-label="Ajouter une image">
              <PlusIcon />
            </button>
            <button className={styles.icons} aria-label="Plus d'options">
              <MoreIcon />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

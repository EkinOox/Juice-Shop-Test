/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import type { ChallengeModel } from 'models/challenge'

import * as utils from '../../lib/utils'

import chai from 'chai'
const expect = chai.expect

describe('utils', () => {
  describe('toSimpleIpAddress', () => {
    it('returns ipv6 address unchanged', () => {
      expect(utils.toSimpleIpAddress('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).to.equal('2001:0db8:85a3:0000:0000:8a2e:0370:7334')
    })

    it('returns ipv4 address fully specified as ipv6 unchanged', () => {
      expect(utils.toSimpleIpAddress('0:0:0:0:0:ffff:7f00:1')).to.equal('0:0:0:0:0:ffff:7f00:1')
    })

    it('returns ipv6 loopback address as ipv4 address', () => {
      expect(utils.toSimpleIpAddress('::1')).to.equal('127.0.0.1')
    })

    it('returns ipv4-mapped address as ipv4 address', () => {
      expect(utils.toSimpleIpAddress('::ffff:192.0.2.128')).to.equal('192.0.2.128')
    })
  })

  describe('extractFilename', () => {
    it('returns standalone filename unchanged', () => {
      expect(utils.extractFilename('test.exe')).to.equal('test.exe')
    })

    it('returns filename from http:// URL', () => {
      expect(utils.extractFilename('http://bla.blubb/test.exe')).to.equal('test.exe')
    })

    it('ignores query part of http:// URL', () => {
      expect(utils.extractFilename('http://bla.blubb/test.exe?bla=blubb&a=b')).to.equal('test.exe')
    })

    it('also works for file:// URLs', () => {
      expect(utils.extractFilename('file:///C//Bla/Blubb/test.exe')).to.equal('test.exe')
    })
  })

  describe('matchesSystemIniFile', () => {
    it('fails on plain input string', () => {
      expect(utils.matchesSystemIniFile('Bla Blubb')).to.equal(false)
    })

    it('passes on Windows 10 system.ini file content', () => {
      expect(utils.matchesSystemIniFile('; for 16-bit app support\n' +
          '[386Enh]\n' +
          'woafont=dosapp.fon\n' +
          'EGA80WOA.FON=EGA80WOA.FON\n' +
          'EGA40WOA.FON=EGA40WOA.FON\n' +
          'CGA80WOA.FON=CGA80WOA.FON\n' +
          'CGA40WOA.FON=CGA40WOA.FON\n' +
          '\n' +
          '[drivers]\n' +
          'wave=mmdrv.dll\n' +
          'timer=timer.drv\n' +
          '\n' +
          '[mci]\n')).to.equal(true)
    })
  })

  describe('matchesEtcPasswdFile', () => {
    it('fails on plain input string', () => {
      expect(utils.matchesEtcPasswdFile('Bla Blubb')).to.equal(false)
    })

    it('passes on Arch Linux passwd file content', () => {
      expect(utils.matchesEtcPasswdFile('test:x:0:0:test:/test:/usr/bin/zsh\n' +
          'bin:x:1:1::/:/usr/bin/nologin\n' +
          'daemon:x:2:2::/:/usr/bin/nologin\n' +
          'mail:x:8:12::/var/spool/mail:/usr/bin/nologin\n' +
          'ftp:x:14:11::/srv/ftp:/usr/bin/nologin\n' +
          'http:x:33:33::/srv/http:/usr/bin/nologin\n' +
          'nobody:x:65534:65534:Nobody:/:/usr/bin/nologin\n' +
          'dbus:x:81:81:System Message Bus:/:/usr/bin/nologin\n' +
          'systemd-journal-remote:x:988:988:systemd Journal Remote:/:/usr/bin/nologin\n' +
          'systemd-network:x:987:987:systemd Network Management:/:/usr/bin/nologin\n' +
          'systemd-oom:x:986:986:systemd Userspace OOM Killer:/:/usr/bin/nologin\n' +
          'systemd-resolve:x:984:984:systemd Resolver:/:/usr/bin/nologin\n' +
          'systemd-timesync:x:983:983:systemd Time Synchronization:/:/usr/bin/nologin\n' +
          'systemd-coredump:x:982:982:systemd Core Dumper:/:/usr/bin/nologin\n' +
          'uuidd:x:68:68::/:/usr/bin/nologin\n' +
          'avahi:x:980:980:Avahi mDNS/DNS-SD daemon:/:/usr/bin/nologin\n' +
          'named:x:40:40:BIND DNS Server:/:/usr/bin/nologin\n' +
          'brltty:x:979:979:Braille Device Daemon:/var/lib/brltty:/usr/bin/nologin\n' +
          'colord:x:978:978:Color management daemon:/var/lib/colord:/usr/bin/nologin\n' +
          'cups:x:209:209:cups helper user:/:/usr/bin/nologin\n' +
          'dhcpcd:x:977:977:dhcpcd privilege separation:/:/usr/bin/nologin\n' +
          'dnsmasq:x:976:976:dnsmasq daemon:/:/usr/bin/nologin\n' +
          'git:x:975:975:git daemon user:/:/usr/bin/git-shell\n' +
          'mpd:x:45:45::/var/lib/mpd:/usr/bin/nologin\n' +
          'nbd:x:974:974:Network Block Device:/var/empty:/usr/bin/nologin\n' +
          'nm-openvpn:x:973:973:NetworkManager OpenVPN:/:/usr/bin/nologin\n' +
          'nvidia-persistenced:x:143:143:NVIDIA Persistence Daemon:/:/usr/bin/nologin\n' +
          'openvpn:x:972:972:OpenVPN:/:/usr/bin/nologin\n' +
          'partimag:x:110:110:Partimage user:/:/usr/bin/nologin\n' +
          'polkitd:x:102:102:PolicyKit daemon:/:/usr/bin/nologin\n' +
          'rpc:x:32:32:Rpcbind Daemon:/var/lib/rpcbind:/usr/bin/nologin\n' +
          'rtkit:x:133:133:RealtimeKit:/proc:/usr/bin/nologin\n' +
          'sddm:x:971:971:Simple Desktop Display Manager:/var/lib/sddm:/usr/bin/nologin\n' +
          'tss:x:970:970:tss user for tpm2:/:/usr/bin/nologin\n' +
          'usbmux:x:140:140:usbmux user:/:/usr/bin/nologin\n' +
          'moi:x:1000:1000:moi:/home/moi:/bin/zsh\n')).to.equal(true)
    })
  })

  describe('utils.getChallengeEnablementStatus', () => {
    const defaultIsEnvironmentFunctions = {
      isDocker: () => false,
      isHeroku: () => false,
      isWindows: () => false,
      isGitpod: () => false
    }

    for (const safetyMode of ['enabled', 'disabled', 'auto'] as const) {
      it(`challenges without disabledEnv are enabled with safetyMode set to ${safetyMode}`, () => {
        const challenge: ChallengeModel = { disabledEnv: null } as unknown as ChallengeModel

        expect(utils.getChallengeEnablementStatus(challenge, safetyMode, defaultIsEnvironmentFunctions))
          .to.deep.equal({ enabled: true, disabledBecause: null })
      })
    }

    const testCases = [
      { name: 'Docker', environmentFunction: 'isDocker' },
      { name: 'Heroku', environmentFunction: 'isHeroku' },
      { name: 'Windows', environmentFunction: 'isWindows' },
      { name: 'Gitpod', environmentFunction: 'isGitpod' }
    ]

    for (const testCase of testCases) {
      it(`safetyMode: 'enabled': challenge with disabledOnEnv ${testCase.name} should be marked as disabled`, () => {
        const challenge: ChallengeModel = { disabledEnv: testCase.name } as unknown as ChallengeModel

        const isEnvironmentFunctions = { ...defaultIsEnvironmentFunctions, [testCase.environmentFunction]: () => true }
        expect(utils.getChallengeEnablementStatus(challenge, 'enabled', isEnvironmentFunctions))
          .to.deep.equal({ enabled: false, disabledBecause: testCase.name })
      })

      it(`safetyMode: 'auto': challenge with disabledOnEnv ${testCase.name} should be marked as disabled`, () => {
        const challenge: ChallengeModel = { disabledEnv: testCase.name } as unknown as ChallengeModel

        const isEnvironmentFunctions = { ...defaultIsEnvironmentFunctions, [testCase.environmentFunction]: () => true }
        expect(utils.getChallengeEnablementStatus(challenge, 'auto', isEnvironmentFunctions))
          .to.deep.equal({ enabled: false, disabledBecause: testCase.name })
      })

      it(`safetyMode: 'disabled': challenge with disabledOnEnv ${testCase.name} should be marked as enabled`, () => {
        const challenge: ChallengeModel = { disabledEnv: testCase.name } as unknown as ChallengeModel

        const isEnvironmentFunctions = { ...defaultIsEnvironmentFunctions, [testCase.environmentFunction]: () => true }
        expect(utils.getChallengeEnablementStatus(challenge, 'disabled', isEnvironmentFunctions))
          .to.deep.equal({ enabled: true, disabledBecause: null })
      })
    }
  })

  describe('isUrl', () => {
    it('returns true for valid http URL', () => {
      expect(utils.isUrl('http://example.com')).to.equal(true)
    })

    it('returns true for valid https URL', () => {
      expect(utils.isUrl('https://example.com')).to.equal(true)
    })

    it('returns false for invalid URL', () => {
      expect(utils.isUrl('not a url')).to.equal(false)
    })

    it('returns false for empty string', () => {
      expect(utils.isUrl('')).to.equal(false)
    })
  })

  describe('startsWith', () => {
    it('returns true when string starts with prefix', () => {
      expect(utils.startsWith('hello world', 'hello')).to.equal(true)
    })

    it('returns false when string does not start with prefix', () => {
      expect(utils.startsWith('hello world', 'world')).to.equal(false)
    })

    it('returns false for null string', () => {
      expect(utils.startsWith(null as any, 'test')).to.equal(false)
    })
  })

  describe('endsWith', () => {
    it('returns true when string ends with suffix', () => {
      expect(utils.endsWith('hello world', 'world')).to.equal(true)
    })

    it('returns false when string does not end with suffix', () => {
      expect(utils.endsWith('hello world', 'hello')).to.equal(false)
    })

    it('returns false for undefined string', () => {
      expect(utils.endsWith(undefined, 'test')).to.equal(false)
    })
  })

  describe('contains', () => {
    it('returns true when string contains element', () => {
      expect(utils.contains('hello world', 'lo wo')).to.equal(true)
    })

    it('returns false when string does not contain element', () => {
      expect(utils.contains('hello world', 'xyz')).to.equal(false)
    })

    it('returns false for empty string', () => {
      expect(utils.contains('', 'test')).to.equal(false)
    })
  })

  describe('containsEscaped', () => {
    it('returns true when string contains escaped element', () => {
      expect(utils.containsEscaped('hello%20world', ' ')).to.equal(true)
    })

    it('returns false when string does not contain escaped element', () => {
      expect(utils.containsEscaped('hello world', 'xyz')).to.equal(false)
    })
  })

  describe('containsOrEscaped', () => {
    it('returns true when string contains plain element', () => {
      expect(utils.containsOrEscaped('hello world', 'world')).to.equal(true)
    })

    it('returns true when string contains escaped element', () => {
      expect(utils.containsOrEscaped('hello%20world', ' ')).to.equal(true)
    })
  })

  describe('unquote', () => {
    it('removes double quotes from string', () => {
      expect(utils.unquote('"hello"')).to.equal('hello')
    })

    it('removes single quotes from string', () => {
      expect(utils.unquote("'hello'")).to.equal('hello')
    })

    it('returns string unchanged if no quotes', () => {
      expect(utils.unquote('hello')).to.equal('hello')
    })
  })

  describe('trunc', () => {
    it('truncates string to specified length', () => {
      expect(utils.trunc('hello world', 5)).to.equal('hello...')
    })

    it('returns string unchanged if shorter than length', () => {
      expect(utils.trunc('hi', 10)).to.equal('hi')
    })
  })

  describe('jwtFrom', () => {
    it('extracts JWT from authorization header', () => {
      expect(utils.jwtFrom({ headers: { authorization: 'Bearer token123' } })).to.equal('token123')
    })

    it('returns undefined when no authorization header', () => {
      expect(utils.jwtFrom({ headers: {} })).to.equal(undefined)
    })
  })

  describe('randomHexString', () => {
    it('generates hex string of specified length', () => {
      const hex = utils.randomHexString(10)
      expect(hex).to.have.lengthOf(10)
      expect(/^[0-9a-f]+$/.test(hex)).to.equal(true)
    })

    it('generates different strings on consecutive calls', () => {
      const hex1 = utils.randomHexString(16)
      const hex2 = utils.randomHexString(16)
      expect(hex1).to.not.equal(hex2)
    })
  })

  describe('toMMMYY', () => {
    it('formats date to MMM YY', () => {
      const date = new Date('2025-12-30')
      const formatted = utils.toMMMYY(date)
      expect(formatted).to.match(/^[A-Z][a-z]{2} \d{2}$/)
    })
  })

  describe('parseJsonCustom', () => {
    it('parses valid JSON string and converts to array format', () => {
      const result = utils.parseJsonCustom('{"key": "value"}')
      expect(result).to.be.an('array')
      expect(result).to.deep.equal([{ key: 'key', value: 'value' }])
    })

    it('handles invalid JSON gracefully', () => {
      expect(() => utils.parseJsonCustom('invalid json')).to.throw(Error, /Unexpected token/)
    })
  })
})

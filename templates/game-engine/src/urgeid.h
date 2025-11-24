#ifndef URGEID_H
#define URGEID_H

#include <string>

struct UrgeIDProfile {
    std::string address;
    std::string username;
    int level;
    int syzygy_score;
};

UrgeIDProfile loadUrgeIDProfile(const char* rpc_url, const std::string& address);

#endif

